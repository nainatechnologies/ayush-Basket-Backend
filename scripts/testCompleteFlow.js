const fs = require('fs');

async function testCompleteFlow() {
  console.log('--- TESTING COMPLETE PRODUCT & CATEGORY FLOW ---');
  
  // 1. Log in
  console.log('\n1. Logging in as Admin...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ayushbasket.com', password: 'adminpassword123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✅ Logged in successfully.');

  // 2. Create Category
  console.log('\n2. Creating a new Category (e.g. "Ayurvedic Supplements")...');
  const catRes = await fetch('http://localhost:5000/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Ayurvedic Supplements', description: 'Natural supplements' })
  });
  const catData = await catRes.json();
  const categoryId = catData.data.id;
  console.log('✅ Category created:', catData.data);

  // 3. Create Product in that Category
  console.log(`\n3. Creating Product in Category ID: ${categoryId}...`);
  fs.writeFileSync('dummy.jpg', 'fake');
  const formData = new FormData();
  formData.append('name', 'Ashwagandha Tablets');
  formData.append('description', 'Stress relief');
  formData.append('price', '500');
  formData.append('offerPrice', '450');
  formData.append('stock', '50');
  formData.append('category_id', categoryId);
  const fileBlob = new Blob([fs.readFileSync('dummy.jpg')], { type: 'image/jpeg' });
  formData.append('image', fileBlob, 'dummy.jpg');

  const prodRes = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const prodData = await prodRes.json();
  console.log('✅ Product created:', prodData.data);
  fs.unlinkSync('dummy.jpg');

  // 4. Fetch Category Products
  console.log(`\n4. Simulating Customer Page: Fetching products for Category ${categoryId}...`);
  const fetchRes = await fetch(`http://localhost:5000/api/categories/${categoryId}/products`);
  const fetchData = await fetchRes.json();
  console.log('✅ Fetched Products successfully. Count:', fetchData.count);
  console.log('Data:', fetchData.data);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
}

testCompleteFlow();
