const API_URL = 'http://localhost:5000/api/products';
let cart = [];
let allProducts = [];

// 1. Professional Currency Formatter
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

// 2. Refined Fetch (Single Source of Truth)
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


// This function bridges the gap between your Cart and Stripe
async function initiateCheckout() {
    // 1. Safety Check: Don't try to buy nothing!
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const btn = document.getElementById('checkout-button');

    try {
        // 2. Visual Feedback for Bonnie's customer
        btn.innerText = "Connecting to Secure Checkout...";
        btn.disabled = true;

        // 3. Send the 'cart' array to your server
        const response = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: cart }),
        });

        if (!response.ok) {
            throw new Error('Server responded with an error');
        }

        // 4. Get the Stripe URL from your backend and go there
        const { url } = await response.json();
        window.location.href = url;

    } catch (error) {
        console.error('Checkout error:', error);
        alert('Could not start checkout. Please check if the backend is running.');

        // Reset button if it fails
        btn.innerText = "Proceed to Checkout";
        btn.disabled = false;
    }
}


// 3. Logic: Add with Quantity
function handlePurchase(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Check if item already in cart
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Add new item with a quantity property
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    openCart(); // Better than toggling (ensure it's open)
}

function displayProducts(products) {
    const gallery = document.getElementById('product-gallery');
    gallery.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'card';

        // Fix image URL path
        const cleanPath = product.image_url.startsWith('/') ? product.image_url : `/${product.image_url}`;
        const imageUrl = `http://localhost:5000${cleanPath}`;

        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
            </div>

            <div class="card-content">
                <div class="category">${product.category_name || 'Handmade'}</div>
                
                <h3>${product.name}</h3>
                
                <p class="description">${product.description || 'No description available.'}</p>
                
                <div style="margin-top: auto;">
                    <p class="price">${formatter.format(product.price)}</p>
                    <button class="add-btn" onclick="handlePurchase(${product.id})">
                        🧵 Add to Cart
                    </button>
                </div>
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
        // 💰 FIX: Changed item.base_price to item.price
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

// 4. UI Helper Functions
function openCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.replace('cart-closed', 'cart-open');
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('cart-open');
    sidebar.classList.toggle('cart-closed');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}



// Kick everything off
init();