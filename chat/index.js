const baseURL = 'https://chat-app-backend-u9hp.onrender.com/api';
const token = localStorage.getItem('token');
let currentGroup = null;
const socket = io.connect('https://chat-app-backend-u9hp.onrender.com', {
    query: {
        token: token
    }
});

socket.on('newMessage', (mesg) => {
    const decoded = parseJwt(token);
    const userId = decoded.userId;
    const mesgBody = document.querySelector('.message-body');
    // if(mesg.groupId === currentGroup && mesg.userId !== decoded.userId){
    //     mesgBody.innerHTML += `<div class="message-body-content">
    //         <p><span style="font-weight: bold">${mesg.name}</span>: ${mesg.message}</p>
    //     </div>` 
    // }
    let mediaUrl = mesg.multimedia;
    let message = mesg.message || '';
    let userName = `${mesg.name}`;
    if(mesg.groupId === currentGroup && mesg.userId !== userId){
        if (!mediaUrl) {
            mesgBody.innerHTML += `<div class="message-body-content">
                    <p><span style="font-weight: bold;">${userName}</span>: ${message}</p>
                </div>`;
        } else {
            let mediaContent;
            if (mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.jpeg') || mediaUrl.endsWith('.png') || mediaUrl.endsWith('.gif')) {
                mediaContent = `<div style="position: relative;">
                                    <a href="${mediaUrl}" download>
                                        <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                    </a>
                                    <img src="${mediaUrl}" />
                                </div>`;
            } else if (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.avi') || mediaUrl.endsWith('.webm')) {
                mediaContent = `<div style="position: relative;">
                                    <a href="${mediaUrl}" download>
                                        <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                    </a>
                                    <video controls><source src="${mediaUrl}"></video>
                                </div>`;
            } else {
                mediaContent = `<div style="position: relative;">
                                    <a href="${mediaUrl}" download>
                                        <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                    </a>
                                    <span>Download File</span>
                                </div>`;
            }
            
            mesgBody.innerHTML += `<div class="message-body-content">
                    <p><span style="font-weight: bold;">${userName}</span>: ${message}</p>
                    ${mediaContent}
                </div>`;
        }
    }

    const images = mesgBody.querySelectorAll('img');
    if(images.length === 0){
        mesgBody.scrollTop = mesgBody.scrollHeight;
    }
    let loadedImageCount = 0;

    images.forEach(image => {
        image.addEventListener('load', () => {
            loadedImageCount++;
            if (loadedImageCount === images.length) {
                // All images have loaded, scroll to the bottom
                mesgBody.scrollTop = mesgBody.scrollHeight;
            }
        });
    });
})

socket.on('userAddedToGroup', async() => {
    try {
        const groupsList = await axios.get(`${baseURL}/user/get-groups`, {headers: {"Authorization": token}});
        showGroups(groupsList.data);
    } catch(err){
        console.log(err);
        alert(err.message);
    }
})

socket.on('userRemovedFromGroup', async(data) => {
    if(data.groupId === currentGroup){
        location.reload();
    } else {
        const groupsList = await axios.get(`${baseURL}/user/get-groups`, {headers: {"Authorization": token}});
        showGroups(groupsList.data);
    }
})

socket.on('adminMade', async(groupId) => {
    if(groupId === currentGroup){
        const showHideUserList = document.getElementById('show-hide-userList');
        if(showHideUserList.classList.contains('fa-angle-left')){
            await showUsers(groupId);
        }
    }
})

socket.on('adminRemoved', async(groupId) => {
    if(groupId === currentGroup){
        const showHideUserList = document.getElementById('show-hide-userList');
        if(showHideUserList.classList.contains('fa-angle-left')){
            await showUsers(groupId);
        }
    }
})


function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}



function showGroups (groups) {
    const groupNames = document.querySelector('.group-names');
    groupNames.innerHTML = '';
    groups.forEach((group) => {
        groupNames.innerHTML += `<div class="group-name" onclick="openGroupChats(${group.id}, '${group.name}')">
                <h1>${group.name}</h1>
            </div>`
    })
}

document.getElementById('create-group-btn').addEventListener('click', async() => {
    const createGroupInput = document.getElementById('create-group').value;
    const token = localStorage.getItem('token');
    if(!token){
        alert('Login First');
        return;
    }
    try{
        const groupRes = await axios.post(`${baseURL}/user/create-group`, {name: createGroupInput}, {headers: {"Authorization": token}});
        document.getElementById('create-group').value = '';
        const groupsList = await axios.get(`${baseURL}/user/get-groups`, {headers: {"Authorization": token}});
        showGroups(groupsList.data);
    } catch(err) {
        console.log(err);
        alert(err.message);
    }
})


window.addEventListener('DOMContentLoaded', async() => {
    try {
        const token = localStorage.getItem('token');
        
        if(!token) {
            alert('login first');
            return;
        }
        const groupsList = await axios.get(`${baseURL}/user/get-groups`, {headers: {"Authorization": token}});
        console.log(groupsList);
        showGroups(groupsList.data);
        const mesgBody = document.querySelector('.message');
        mesgBody.innerHTML = `<p style="display: flex; justify-content: center; align-items: center; font-size:1.2rem;">Open any group to see messages</p>`
    } catch(err) {
        console.log(err);
        alert(err.message);
    }
})

async function createMessage (groupId) {
    const mesgInput = document.getElementById('message').value;
    const fileInput = document.getElementById('file-input').files[0];
    const token = localStorage.getItem('token');
    const decoded = parseJwt(token);
    if(!token){
        alert('Login First');
        return;
    }
    try{
        let mediaUrl = null;
        if (!mesgInput && !fileInput) {
            alert('Please enter a message or select a file.');
            return;
        }

        if (fileInput) {
            const formData = new FormData();
            formData.append('groupId', groupId);
            formData.append('file', fileInput);

            const response = await axios.post(`${baseURL}/user/send-file`, formData, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'multipart/form-data'
                }
            });

            mediaUrl = response.data.url;

            await axios.post(`${baseURL}/user/chat`, { groupId, message: mesgInput || null, multimedia: mediaUrl }, {
                headers: { "Authorization": token }
            });


        } else {
            await axios.post(`${baseURL}/user/chat`, { groupId, message: mesgInput, multimedia: null }, {
                headers: { "Authorization": token }
            });
        }
        document.getElementById('message').value = '';
        document.getElementById('file-input').value = '';
        const fileInputLabel = document.getElementById('file-input-label');

        fileInputLabel.innerHTML =`<i class="fas fa-images">`;


        displaySingleMesg(mesgInput, mediaUrl, groupId);
    } catch(err) {
        console.log(err);
        alert(err.message);
    }
}


// whenever opening any groups display the messages 
function showMessage(messages, userId, infiniteScroll) {
    let messageBodyContent = '';
    let userName = '';
    messages.forEach((element) => {
        let mediaUrl = element.multimedia;
        let message = element.message || '';
        if(element.userId === userId){
            if (!mediaUrl) {
                messageBodyContent += `<div class="message-body-content">
                        <p><span style="font-weight: bold; color: green;">You</span>: ${message}</p>
                    </div>`;
            } else {
                let mediaContent;
                if (mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.jpeg') || mediaUrl.endsWith('.png') || mediaUrl.endsWith('.gif')) {
                    mediaContent = `<div style="position: relative;">
                                        <a href="${mediaUrl}" download>
                                            <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                        </a>
                                        <img src="${mediaUrl}" />
                                    </div>`;
                } else if (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.avi') || mediaUrl.endsWith('.webm')) {
                    mediaContent = `<div style="position: relative;">
                                        <a href="${mediaUrl}" download>
                                            <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                        </a>
                                        <video controls><source src="${mediaUrl}"></video>
                                    </div>`;
                } else {
                    mediaContent = `<div style="position: relative;">
                                        <a href="${mediaUrl}" download>
                                            <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                        </a>
                                        <span>Download File</span>
                                    </div>`;
                }
                
                messageBodyContent += `<div class="message-body-content">
                        <p><span style="font-weight: bold; color: green;">You</span>: ${message}</p>
                        ${mediaContent}
                    </div>`;
            }
        } else {
            userName = `${element.name}`;
            if (!mediaUrl) {
                messageBodyContent += `<div class="message-body-content">
                        <p><span style="font-weight: bold;">${userName}</span>: ${message}</p>
                    </div>`;
            } else {
                let mediaContent;
                if (mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.jpeg') || mediaUrl.endsWith('.png') || mediaUrl.endsWith('.gif')) {
                    mediaContent = `<div style="position: relative;">
                                        <a href="${mediaUrl}" download>
                                            <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                        </a>
                                        <img src="${mediaUrl}" />
                                    </div>`;
                } else if (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.avi') || mediaUrl.endsWith('.webm')) {
                    mediaContent = `<div style="position: relative;">
                                        <a href="${mediaUrl}" download>
                                            <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                        </a>
                                        <video controls><source src="${mediaUrl}"></video>
                                    </div>`;
                } else {
                    mediaContent = `<div style="position: relative;">
                                        <a href="${mediaUrl}" download>
                                            <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                        </a>
                                        <span>Download File</span>
                                    </div>`;
                }
                
                messageBodyContent += `<div class="message-body-content">
                        <p><span style="font-weight: bold;">${userName}</span>: ${message}</p>
                        ${mediaContent}
                    </div>`;
            }
        }
    })

    const mesgBody = document.querySelector('.message-body');
    const loaderElement = document.querySelector('.loader');
    if(infiniteScroll){
        loaderElement.insertAdjacentHTML('afterend', messageBodyContent);
        return;
    }

    mesgBody.insertAdjacentHTML('beforeend', messageBodyContent);

    const images = mesgBody.querySelectorAll('img');

    if(images.length === 0){
        mesgBody.scrollTop = mesgBody.scrollHeight;
        return;
    }

    let loadedImageCount = 0;

    images.forEach(image => {
        image.addEventListener('load', () => {
            loadedImageCount++;
            if (loadedImageCount === images.length) {
                // All images have loaded, scroll to the bottom
                mesgBody.scrollTop = mesgBody.scrollHeight;
            }
        });
    });
}

function displaySingleMesg(message, mediaUrl, groupId) {
    const mesgBody = document.querySelector('.message-body');
    if (!mediaUrl) {
        mesgBody.innerHTML += `<div class="message-body-content">
                <p><span style="font-weight: bold; color: green;">You</span>: ${message}</p>
            </div>`;
    } else {
        let mediaContent;
        if (mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.jpeg') || mediaUrl.endsWith('.png') || mediaUrl.endsWith('.gif')) {
            mediaContent = `<div style="position: relative;">
                                <a href="${mediaUrl}" download>
                                    <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                </a>
                                <img src="${mediaUrl}" />
                            </div>`;
        } else if (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.avi') || mediaUrl.endsWith('.webm')) {
            mediaContent = `<div style="position: relative;">
                                <a href="${mediaUrl}" download>
                                    <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                </a>
                                <video controls><source src="${mediaUrl}"></video>
                            </div>`;
        } else {
            mediaContent = `<div style="position: relative;">
                                <a href="${mediaUrl}" download>
                                    <i class="fas fa-download" style="position: absolute; top: 0; right: 0; font-size: 1.2rem;"></i>
                                </a>
                                <span>Download File</span>
                            </div>`;
        }
        
        mesgBody.innerHTML += `<div class="message-body-content">
                <p><span style="font-weight: bold; color: green;">You</span>: ${message}</p>
                ${mediaContent}
            </div>`;
    }
    const images = mesgBody.querySelectorAll('img');
    if(images.length === 0){
        mesgBody.scrollTop = mesgBody.scrollHeight;
    }
    let loadedImageCount = 0;

    images.forEach(image => {
        image.addEventListener('load', () => {
            loadedImageCount++;
            if (loadedImageCount === images.length) {
                // All images have loaded, scroll to the bottom
                mesgBody.scrollTop = mesgBody.scrollHeight;
            }
        });
    });
}

async function openGroupChats(groupId, groupName) {

    try {
        const usersList = document.querySelector('.users-list');
        usersList.style.width = '0';
        currentGroup = groupId;
        await showMessageBox(groupId, groupName);
    } catch(err) {
        console.log(err);
        alert(err.message);
    }
}
async function addToGroup(groupId, userId){
    try {
        const token = localStorage.getItem('token');
        await axios.post(`${baseURL}/user/add-user`, {userId, groupId}, {headers: {"Authorization": token}});
        showUsers(groupId);
    } catch(err){
        console.log(err);
        alert(err.message);
    }
}
async function removeFromGroup(groupId, userId){
    try {
        const token = localStorage.getItem('token');
        await axios.post(`${baseURL}/user/remove-user`, {userId, groupId}, {headers: {"Authorization": token}});
        showUsers(groupId);
    } catch(err){
        console.log(err);
        alert(err.message);
    }
}
async function makeAdmin(groupId, userId){
    try {
        const token = localStorage.getItem('token');
        await axios.post(`${baseURL}/user/make-admin`, {userId, groupId}, {headers: {"Authorization": token}});
        showUsers(groupId);
    } catch(err){
        console.log(err);
        alert(err.message);
    }
}
async function removeFromAdmin(groupId, userId){
    try {
        const token = localStorage.getItem('token');
        await axios.post(`${baseURL}/user/remove-admin`, {userId, groupId}, {headers: {"Authorization": token}});
        showUsers(groupId);
    } catch(err){
        console.log(err);
        alert(err.message);
    }
}

async function showUsers(groupId) {
    const usersBody = document.querySelectorAll('.users-body');
    try {
        const token = localStorage.getItem('token');
        const decoded = parseJwt(token);
        const groupUsers = await axios.get(`${baseURL}/user/get-group-users/${groupId}`, {headers: {"Authorization": token}});
        const availableUsers = await axios.get(`${baseURL}/user/get-available-users/${groupId}`, {headers: {"Authorization": token}})


        usersBody[0].innerHTML = '';
        usersBody[1].innerHTML = '';

        console.log(groupUsers.data);
        console.log(availableUsers.data);
        
        if(groupUsers.headers['isadmin'] === 'true'){
            groupUsers.data.map((user) => {
                if(user.id === decoded.userId){
                    if(user.usergroups[0].isAdmin) {
                        usersBody[0].innerHTML += `<div class="users-body-content">
                            <p>${user.name}(Admin)(You)</p>
                        </div>`
                    } else {
                        usersBody[0].innerHTML += `<div class="users-body-content">
                            <p>${user.name}(You)</p>
                        </div>`
                    }
                } else {
                    if(user.usergroups[0].isAdmin) {
                        usersBody[0].innerHTML += `<div class="users-body-content">
                            <p>${user.name}(Admin)</p>
                            <div class="group-users-btn">
                                <button type="button" onclick="removeFromAdmin(${groupId}, ${user.id})">Remove from admin</button>
                                <button type="button" onclick="removeFromGroup(${groupId}, ${user.id})">Remove from group</button>
                            </div>
                        </div>`
                    } else {
                        usersBody[0].innerHTML += `<div class="users-body-content">
                            <p>${user.name}</p>
                            <div class="group-users-btn">
                                <button type="button" onclick="makeAdmin(${groupId}, ${user.id})">Make admin</button>
                                <button type="button" onclick="removeFromGroup(${groupId}, ${user.id})">Remove from group</button>
                            </div>
                        </div>`
                    }
                }
            })
        } else {
            groupUsers.data.map((user) => {
                if(user.id === decoded.userId){
                    if(user.usergroups[0].isAdmin) {
                        usersBody[0].innerHTML += `<div class="users-body-content">
                            <p>${user.name}(Admin)(You)</p>
                        </div>`
                    } else {
                        usersBody[0].innerHTML += `<div class="users-body-content">
                            <p>${user.name}(You)</p>
                        </div>`
                    }
                } else {
                    if(user.usergroups[0].isAdmin) {
                        usersBody[0].innerHTML += `<div class="users-body-content">
                            <p>${user.name}(Admin)</p>
                        </div>`
                    } else {
                        usersBody[0].innerHTML += `<div class="users-body-content">
                            <p>${user.name}</p>
                        </div>`
                    }

                }
            })
        }

        if(availableUsers.headers['isadmin'] === 'true'){
            availableUsers.data.map((user) => {
                usersBody[1].innerHTML += `<div class="users-body-content">
                    <p>${user.name}</p>
                    <div class="group-users-btn">
                        <button type="button" onclick="addToGroup(${groupId}, ${user.id})">Add to group</button>
                    </div>
                </div>`
            })
        } else {
            availableUsers.data.map((user) => {
                usersBody[1].innerHTML += `<div class="users-body-content">
                    <p>${user.name}</p>
                </div>`
            }) 
        }
    } catch(err) {
        console.log(err);
        alert(err.message);
    }
}

async function showMessageBox (groupId, groupName) {
    try {
        const messageBox = document.querySelector('.message');
        messageBox.innerHTML = '';

        messageBox.innerHTML = `<div class="message-header">
                <div class="message-header-content">
                    <h1>${groupName}</h1>
                </div>
                <div class="open-user-list" onclick="userListHandler(${groupId})">
                    <i class="fa-solid fa-angle-right" id="show-hide-userList"></i>
                </div>
            </div>
            <div class="message-body">
                <div class="loader">Loading Messages...</div>
            
            </div>
            <div class="message-footer">
                <div class="message-input">
                    <label for="file-input" id="file-input-label">
                        <i class="fas fa-images"></i>
                    </label>
                    <input type="file" id="file-input" name="file" style="display: none;">
                    <input type="text" id="message" name="message">
                </div>
                <div class="message-send">
                    <button type="button" id="send-message" onclick="createMessage(${groupId})">Send</button>
                </div>
            </div>`

            const fileInput = document.getElementById('file-input');

            // Add event listener to file input
            fileInput.addEventListener('change', () => {
                const selectedFile = fileInput.files[0];

                const fileInputLabel = document.getElementById('file-input-label');
                if(selectedFile.name.length > 14){
                    var filename = selectedFile.name.slice(0,6) + '...' + selectedFile.name.slice(selectedFile.name.length-5);
                }

                if (selectedFile) {
                    fileInputLabel.innerHTML =`<i class="fas fa-images"><span style="font-size: 1rem; font-weight: normal">${filename}</span>`;
                }
            });

            const decodedToken = parseJwt(token);
            // let lastMesgId;
            // const localMessages = JSON.parse(localStorage.getItem('messages')) || {};
            
            // if(localMessages[groupId] && localMessages[groupId].length !== 0){
            //     lastMesgId = localMessages[groupId][localMessages[groupId].length-1].id;
            //     console.log(lastMesgId);
            // } else {
            //     localMessages[groupId] = [];
            //     lastMesgId = undefined;
            // }
            
            // const messages = await axios.get(`${baseURL}/user/chat/${groupId}?lastMesgId=${lastMesgId}`, {headers: {"Authorization": token}});

            // const newMesg = {[groupId]: [...localMessages[groupId], ...messages.data]}
            // let allMesg = {...localMessages,  ...newMesg};
            // if(allMesg[groupId].length > 20) {
            //     allMesg[groupId] = allMesg[groupId].slice(-20);
            // }
            
            // localStorage.setItem('messages', JSON.stringify(allMesg));


            isLoading = false;
            lastMessageTimestamp = null;
            const initialMessages = await fetchMessages(null, 20);
            lastMessageTimestamp = initialMessages.length > 0 ? initialMessages[0].createdAt : null;


            showMessage(initialMessages, decodedToken.userId, false);
            document.querySelector('.message-body').addEventListener('scroll', handleScroll);
    } catch(err){
        console.log(err);
        alert(err.message);
    }
}

async function userListHandler(groupId) {
    try {
        const showHideUserList = document.getElementById('show-hide-userList');
        if(showHideUserList.classList.contains('fa-angle-right')){
            await showUsers(groupId);
            showHideUserList.classList.remove('fa-angle-right');
            showHideUserList.classList.add('fa-angle-left');
            const usersList = document.querySelector('.users-list');
            usersList.style.width = '30vw';
        } else {
            showHideUserList.classList.add('fa-angle-right');
            showHideUserList.classList.remove('fa-angle-left');
            const usersList = document.querySelector('.users-list');
            usersList.style.width = '0';
        }
    } catch(err){
        console.log(err);
        alert(err.message);
    }
}


let isLoading = false;
let lastMessageTimestamp = null;
// Function to fetch messages from the backend
async function fetchMessages(cursor, limit) {
    try {
        const response = await axios.get(`${baseURL}/user/chat/${currentGroup}?cursor=${cursor}&limit=${limit}`, {headers: {"Authorization": token}});
        return response.data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
}

async function handleScroll() {
    const messageContainer = document.querySelector('.message-body');
    if (messageContainer.scrollTop === 0 && !isLoading) {
        isLoading = true;
        document.querySelector('.loader').style.display = 'flex';

        try {
            const token = localStorage.getItem('token');
            const decodeToken = parseJwt(token);
            console.log(lastMessageTimestamp);
            const messages = await fetchMessages(lastMessageTimestamp, 20);
            console.log(messages);
            showMessage(messages, decodeToken.userId, true);
            lastMessageTimestamp = messages.length > 0 ? messages[0].createdAt : lastMessageTimestamp;
            document.querySelector('.loader').style.display = 'none';
            if(messages.length > 0){
                isLoading = false;
            }
        } catch (error) {
            isLoading = false;
            document.querySelector('loader').style.display = 'none';
            console.error('Error loading more messages:', error);
        }
    }
}