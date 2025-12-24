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
    gallery.innerHTML = ''; // Clear previous content

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'card';

        // We use a fallback image in case image_url is null (like your Poker Card Holder)
        const displayImage = product.image_url || 'public/images/placeholder.jpg';

        productCard.innerHTML = `
            <div class="category">${product.category_id === 1 ? 'Bibs' : 'Accessories'}</div>
            
            <img src="${displayImage}" 
                 alt="${product.name}" 
                 class="product-image" 
                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">

            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">$${product.base_price}</p>
            <button onclick="handlePurchase(${product.id})">Add to Cart</button>
        `;

        gallery.appendChild(productCard);
    });
}

async function handlePurchase(productId) {
    try {
        console.log(`Initiating purchase for Product ID: ${productId}`);

        // 1. Tell the backend which product we want to buy
        const response = await fetch('http://localhost:5000/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: productId }),
        });

        const session = await response.json();

        // 2. If the backend returns a Stripe URL, send the user there
        if (session.url) {
            window.location.href = session.url;
        } else {
            alert('Checkout failed. Please try again.');
            console.error('Session error:', session);
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('Could not connect to the payment server.');
    }
}

// Start the process
fetchProducts();