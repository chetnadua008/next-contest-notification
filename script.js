document.addEventListener('DOMContentLoaded', function () {
    // fetch api request to backend
    fetch('http://localhost:3000/getdata')
        .then(response => response.text())
        .then(data => {
            //inject response into frontend
            document.getElementById('result').innerHTML = data;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('result').textContent = 'OOPS! Something went Wrong :(';
        });
});