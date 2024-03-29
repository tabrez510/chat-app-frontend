const baseURL = 'https://chat-app-backend-u9hp.onrender.com/api';

const signinBtn = document.querySelector('form');

signinBtn.addEventListener('submit', async(event) => {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    const successMesg = document.getElementById('signin-successful');
    const userNotFound = document.getElementById('user-not-found');
    const incorrectPassword = document.getElementById('incorrect-password');
    try {
        const isMatch = await axios.post(`${baseURL}/user/signin`, {email, password});
        console.log(isMatch);
        if(isMatch.status === 200) {
            userNotFound.style.display = 'none';
            incorrectPassword.style.display = 'none';
            successMesg.style.display = 'block';

            document.getElementById('email').value = '';
            document.getElementById('password').value = '';

            localStorage.setItem('token', isMatch.data.token);

            window.location.href = `../chat/index.html`;
        }

    } catch(err) {
        if(err.response.status === 404){
            userNotFound.style.display = 'block';
            incorrectPassword.style.display = 'none';
            successMesg.style.display = 'none';
        }

        if(err.response.status === 401){
            userNotFound.style.display = 'none';
            incorrectPassword.style.display = 'block';
            successMesg.style.display = 'none';
        }
    }
})