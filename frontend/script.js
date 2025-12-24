const API_URL = 'http://localhost:5000/api/products';

async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('product-gallery').innerHTML = `
            <p style="color: red;">Oops! We couldn't load the products. Make sure your backend server is running.</p>
        `;
    }
}

function displayProducts(products) {
    const gallery = document.getElementById('product-gallery');
    
    // Clear any "Loading..." text
    gallery.innerHTML = '';

    products.forEach(product => {
        // Create a card for each product
        const productCard = document.createElement('div');
        productCard.className = 'card';

        productCard.innerHTML = `
            <div class="category">${product.category}</div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="metadata">
                <span><strong>Fabric:</strong> ${product.metadata.fabric}</span>
            </div>
            <p class="price">$${product.base_price}</p>
            <button onclick="handlePurchase(${product.id})">Add to Cart</button>
        `;

        gallery.appendChild(productCard);
    });
}

function handlePurchase(id) {
    alert(`Great choice! We'll be connecting Product #${id} to Stripe in the next lesson.`);
}

// Start the process
fetchProducts();