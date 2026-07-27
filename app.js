// ===== Storage & State =====
const STORAGE_KEY = 'attarat_albarakah_products';
let products = [];
let currentEditingId = null;
let currentViewingId = null;
let currentFilter = 'all';

// ===== DOM Elements =====
const productsList = document.getElementById('products');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('search');
const productModal = document.getElementById('productModal');
const detailsModal = document.getElementById('detailsModal');
const productForm = document.getElementById('productForm');
const filterBtns = document.querySelectorAll('.filter-btn');
const toast = document.getElementById('toast');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    renderProducts();
    setupEventListeners();
});

// ===== Event Listeners =====
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', renderProducts);

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderProducts();
        });
    });

    // Form Submit
    productForm.addEventListener('submit', handleFormSubmit);

    // Profit calculation
    document.getElementById('purchasePrice').addEventListener('input', updateProfitDisplay);

    // Modal close on overlay click
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target.id === 'productModal') closeModal();
    });

    document.getElementById('detailsModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailsModal') closeDetailsModal();
    });
}

// ===== Storage Functions =====
function loadProducts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        products = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading products:', error);
        products = [];
        showToast('خطأ في تحميل البيانات', 'error');
    }
}

function saveProducts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
        console.error('Error saving products:', error);
        showToast('خطأ في حفظ البيانات', 'error');
    }
}

// ===== Render Functions =====
function renderProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    let filtered = products.filter(product => {
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            (product.type && product.type.toLowerCase().includes(searchTerm)) ||
            (product.supplier && product.supplier.toLowerCase().includes(searchTerm));
        
        const matchesFilter = currentFilter === 'all' || product.category === currentFilter;
        
        return matchesSearch && matchesFilter;
    });

    productsList.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filtered.forEach(product => {
            productsList.appendChild(createProductCard(product));
        });
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => viewProduct(product.id));

    const profit = product.purchasePrice - product.sellingPrice;
    const profitPercent = product.purchasePrice > 0 
        ? ((profit / product.purchasePrice) * 100).toFixed(1)
        : 0;

    let detailsHTML = `
        <div class="card-header">
            <h2>${escapeHtml(product.name)}</h2>
            <span class="category">${escapeHtml(product.category)}</span>
        </div>
        <div class="card-rows">
    `;

    if (product.type) {
        detailsHTML += `
            <div class="card-row">
                <span class="row-label">النوع</span>
                <span class="row-value">${escapeHtml(product.type)}</span>
            </div>
        `;
    }

    if (product.grade) {
        detailsHTML += `
            <div class="card-row">
                <span class="row-label">الدرجة</span>
                <span class="row-value">${escapeHtml(product.grade)}</span>
            </div>
        `;
    }

    detailsHTML += `
        <div class="card-row">
            <span class="row-label">سعر الشراء</span>
            <span class="row-value">${product.purchasePrice.toFixed(2)} ر.س</span>
        </div>
        <div class="card-row">
            <span class="row-label">سعر البيع</span>
            <span class="row-value price-sell">${product.sellingPrice.toFixed(2)} ر.س</span>
        </div>
    `;

    if (profit > 0) {
        detailsHTML += `
            <div class="card-row profit-row">
                <span class="row-label">الربح المتوقع</span>
                <span class="row-value profit-value">+${profit.toFixed(2)} ر.س (${profitPercent}%)</span>
            </div>
        `;
    }

    if (product.supplier) {
        detailsHTML += `
            <div class="card-row">
                <span class="row-label">المورد</span>
                <span class="row-value">${escapeHtml(product.supplier)}</span>
            </div>
        `;
    }

    detailsHTML += '</div>';

    card.innerHTML = detailsHTML;
    return card;
}

// ===== Modal Functions =====
function openAddModal() {
    currentEditingId = null;
    productForm.reset();
    document.getElementById('modalTitle').textContent = 'إضافة صنف جديد';
    document.getElementById('profitInfo').style.display = 'none';
    productModal.classList.add('active');
    document.getElementById('productName').focus();
}

function openEditModal(id) {
    currentEditingId = id;
    const product = products.find(p => p.id === id);
    
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productType').value = product.type || '';
        document.getElementById('productGrade').value = product.grade || '';
        document.getElementById('purchasePrice').value = product.purchasePrice;
        document.getElementById('sellingPrice').value = product.sellingPrice;
        document.getElementById('productSupplier').value = product.supplier || '';
        document.getElementById('productNotes').value = product.notes || '';
        
        document.getElementById('modalTitle').textContent = 'تعديل الصنف';
        updateProfitDisplay();
        productModal.classList.add('active');
    }
}

function closeModal() {
    productModal.classList.remove('active');
    currentEditingId = null;
}

function closeDetailsModal() {
    detailsModal.classList.remove('active');
    currentViewingId = null;
}

// ===== Form Handling =====
function handleFormSubmit(e) {
    e.preventDefault();

    const productData = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        type: document.getElementById('productType').value.trim(),
        grade: document.getElementById('productGrade').value.trim(),
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
        sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
        supplier: document.getElementById('productSupplier').value.trim(),
        notes: document.getElementById('productNotes').value.trim(),
    };

    // Validation
    if (!productData.name) {
        showToast('الرجاء إدخال اسم الصنف', 'error');
        return;
    }

    if (!productData.category) {
        showToast('الرجاء اختيار التصنيف', 'error');
        return;
    }

    if (isNaN(productData.purchasePrice) || productData.purchasePrice < 0) {
        showToast('الرجاء إدخال سعر شراء صحيح', 'error');
        return;
    }

    if (isNaN(productData.sellingPrice) || productData.sellingPrice < 0) {
        showToast('الرجاء إدخال سعر بيع صحيح', 'error');
        return;
    }

    if (currentEditingId) {
        // Update
        const product = products.find(p => p.id === currentEditingId);
        if (product) {
            Object.assign(product, {
                ...productData,
                updatedAt: new Date().toISOString(),
            });
            showToast('✓ تم تحديث الصنف بنجاح', 'success');
        }
    } else {
        // Create
        products.push({
            id: Date.now(),
            ...productData,
            createdAt: new Date().toISOString(),
        });
        showToast('✓ تم إضافة الصنف بنجاح', 'success');
    }

    saveProducts();
    renderProducts();
    closeModal();
}

function updateProfitDisplay() {
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const sellingPrice = parseFloat(document.getElementById('sellingPrice').value) || 0;
    const profit = purchasePrice - sellingPrice;
    const profitPercent = purchasePrice > 0 ? ((profit / purchasePrice) * 100).toFixed(1) : 0;

    const profitInfo = document.getElementById('profitInfo');
    if (purchasePrice > 0 && sellingPrice > 0) {
        profitInfo.style.display = 'block';
        document.getElementById('profitAmount').textContent = profit.toFixed(2);
        document.getElementById('profitPercent').textContent = profitPercent;
    } else {
        profitInfo.style.display = 'none';
    }
}

// ===== View/Edit/Delete =====
function viewProduct(id) {
    currentViewingId = id;
    const product = products.find(p => p.id === id);

    if (product) {
        const profit = product.purchasePrice - product.sellingPrice;
        const profitPercent = product.purchasePrice > 0
            ? ((profit / product.purchasePrice) * 100).toFixed(1)
            : 0;

        let detailsHTML = `
            <div class="detail-item">
                <span class="detail-label">اسم الصنف</span>
                <span class="detail-value">${escapeHtml(product.name)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">التصنيف</span>
                <span class="detail-value">${escapeHtml(product.category)}</span>
            </div>
        `;

        if (product.type) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">النوع</span>
                    <span class="detail-value">${escapeHtml(product.type)}</span>
                </div>
            `;
        }

        if (product.grade) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">الدرجة</span>
                    <span class="detail-value">${escapeHtml(product.grade)}</span>
                </div>
            `;
        }

        detailsHTML += `
            <div class="detail-item">
                <span class="detail-label">سعر الشراء</span>
                <span class="detail-value">${product.purchasePrice.toFixed(2)} ر.س</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">سعر البيع</span>
                <span class="detail-value">${product.sellingPrice.toFixed(2)} ر.س</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الربح المتوقع</span>
                <span class="detail-value">${profit.toFixed(2)} ر.س (${profitPercent}%)</span>
            </div>
        `;

        if (product.supplier) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">المورد</span>
                    <span class="detail-value">${escapeHtml(product.supplier)}</span>
                </div>
            `;
        }

        if (product.notes) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">ملاحظات</span>
                    <span class="detail-value">${escapeHtml(product.notes)}</span>
                </div>
            `;
        }

        document.getElementById('productDetails').innerHTML = detailsHTML;
        document.getElementById('detailsTitle').textContent = product.name;
        detailsModal.classList.add('active');
    }
}

function editProduct() {
    if (currentViewingId) {
        closeDetailsModal();
        openEditModal(currentViewingId);
    }
}

function deleteProduct() {
    if (!currentViewingId) return;
    
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
        products = products.filter(p => p.id !== currentViewingId);
        saveProducts();
        renderProducts();
        closeDetailsModal();
        showToast('✓ تم حذف الصنف بنجاح', 'success');
    }
}

// ===== Utility Functions =====
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Export/Import Backup =====
window.exportData = function() {
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attarat-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('✓ تم تحميل النسخة الاحتياطية', 'success');
};

window.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported)) {
                    products = imported;
                    saveProducts();
                    renderProducts();
                    showToast('✓ تم استرجاع البيانات بنجاح', 'success');
                } else {
                    showToast('✗ صيغة الملف غير صحيحة', 'error');
                }
            } catch (error) {
                showToast('✗ خطأ في استرجاع البيانات', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};
