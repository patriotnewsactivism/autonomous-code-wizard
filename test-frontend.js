// Simple test to verify the frontend can communicate with the backend
fetch('http://localhost:3001/functions/v1/analyze-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: 'var x = 1;\nconsole.log(x);'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  console.log('Issues found:', data.issues.length);
  console.log('Summary:', data.summary);
})
.catch((error) => {
  console.error('Error:', error);
});