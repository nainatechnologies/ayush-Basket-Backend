const fs = require('fs');

async function testBackend() {
  console.log('--- TESTING ADMIN BACKEND ---');

  // 1. Log in to get the token
  console.log('\n1. Logging in as Admin...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ayushbasket.com', password: 'adminpassword123' })
  });
  const loginData = await loginRes.json();
  
  if (!loginData.success) {
    console.log('Login failed!', loginData);
    return;
  }
  
  const token = loginData.token;
  console.log('✅ Login Successful! Token received.');

  // 2. Test Dashboard Stats
  console.log('\n2. Fetching Dashboard Stats...');
  const statsRes = await fetch('http://localhost:5000/api/dashboard/stats', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  console.log('✅ Dashboard Stats:', statsData.data);

  // 3. Test Image Upload (Product Creation)
  console.log('\n3. Testing Product Creation with Image Upload...');
  
  // We will create a dummy text file to act as our "image" for this test
  fs.writeFileSync('dummy-image.jpg', 'fake image data');
  
  const formData = new FormData();
  formData.append('name', 'Test Premium Product');
  formData.append('price', '99.99');
  formData.append('stock', '50');
  
  // Convert Node.js file buffer to Blob so fetch can send it as a file
  const fileBuffer = fs.readFileSync('dummy-image.jpg');
  const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
  formData.append('image', fileBlob, 'dummy-image.jpg');

  const productRes = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }, // Notice we DON'T set Content-Type! FormData does it.
    body: formData
  });
  
  const productData = await productRes.json();
  console.log('✅ Product Created:', productData.data);

  // Clean up dummy file
  fs.unlinkSync('dummy-image.jpg');
}

testBackend();
