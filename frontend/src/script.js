const API_URL = 'http://localhost:5000/api/products';
let cart = [];
let allProducts = [];

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

async function init() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch');
        
        allProducts = await response.json();
        displayProducts(allProducts);
    } catch (error) {
        console.error('Initial load error:', error);
        document.getElementById('product-gallery').innerHTML = `
            <p class="error">Unable to load shop. Please try again later.</p>
        `;
    }
}

// ... initiateCheckout and handlePurchase stay the same ...

function displayProducts(products) {
    const gallery = document.getElementById('product-gallery');
    gallery.innerHTML = ''; 

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'card';

        // Use the backend URL or a fallback
        const displayImage = product.image_url ? `http://localhost:5000${product.image_url}` : 'https://via.placeholder.com/300x200?text=No+Image';

        productCard.innerHTML = `
            <div class="category">${product.category_name}</div>
            
            <div class="product-image-container">
                <img src="${displayImage}" 
                    alt="${product.name}" 
                    class="product-image" 
                    onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
            </div>

            <div class="card-content">
                <h3>${product.name}</h3>
                
                <p class="dimensions"><em>${product.category_dimensions}</em></p>
                
                <p class="description">${product.description}</p>
                
                <p class="price">${formatter.format(product.price)}</p>
                
                <button class="add-btn" onclick="handlePurchase(${product.id})">Add to Cart</button>
            </div>
        `;

        gallery.appendChild(productCard);
    });
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');

    container.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    cart.forEach((item, index) => {
        // Updated to item.price
        const itemTotal = parseFloat(item.price) * item.quantity;
        total += itemTotal;
        itemCount += item.quantity;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-row">
                <span>${item.quantity}x <strong>${item.name}</strong></span>
                <span>${formatter.format(itemTotal)}</span>
                <button onclick="removeFromCart(${index})" class="remove-btn">&times;</button>
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.innerText = formatter.format(total).replace('$', '');
    countEl.innerText = itemCount;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
    }
}

// ... rest of the UI helpers (openCart, toggleCart, etc.) ...