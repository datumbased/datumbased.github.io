// https://desert-gazelle.auth.us-east-1.amazoncognito.com/login?response_type=token&client_id=4sjvd0a57u5t7cljtmqvbeujm2&redirect_uri=https://127.0.0.1:8080/account.html

;(function() {

	'use strict';

	var CONFIG = {
		user_pool_id: 'us-east-1_BqowlViAD',
		client_id: '4sjvd0a57u5t7cljtmqvbeujm2',
		identity_pool_id: 'us-east-1:abae9db7-d596-41a1-be76-7ac0ba785be7',
		identity_pool_url: 'cognito-idp.us-east-1.amazonaws.com/us-east-1_BqowlViAD',
		region: 'us-east-1',
		bucket: 'desert-gazelle',
	}

	var credentials;
	var serviceProvider;
	var URLParams;
	var user;
	var auth;
	var s3;
	var userKeyPrefix;
	var fileList = [];

	var mainEl = document.getElementById('main');
	var usernameEl = document.getElementById('username');
	var fileInputEl = document.getElementById('file-input');
	var fileHandlerEl = document.getElementById('file-handler');
	var loaderEl = document.getElementById('loader');
	var fileListEl = document.getElementById('file-list');
	var errorEl = document.getElementById('error');
	var successEl = document.getElementById('success');


	function hideLoader() {
		loaderEl.classList.add('hidden');
	}

	function showLoader() {
		loaderEl.classList.remove('hidden');
	}

	function getURLParams() {
  	var params = {};
	  document.location.hash
		  .split('#')[1]
		  .split('&')
		  .forEach((paramStr) => {
		    params[paramStr.split('=')[0]] = paramStr.split('=')[1];
		  });
		return params;
	}

	function checkAuth() {
		return URLParams.hasOwnProperty('access_token');
	}

	function userLoggedIn(providerName, token) {
		credentials.params.Logins = credentials.params.Logins || {};
		credentials.params.Logins[providerName] = token;
		credentials.expired = true;
		AWS.config.credentials = credentials;
	}

	function setTemplate() {
		usernameEl.innerText = user['Username'];
	}

	function getObject(filename) {
		 s3.getObject({
		  Bucket: CONFIG['bucket'],
		  Key: userKeyPrefix + filename,
		 }, function(err, data) {
		   if (error) handleError(error);
		   else
		   	var objectData = data.Body.toString('utf-8');
		   	console.log(objectData);
		});
	}

	function handleError(error) {
		console.log(error);
		errorEl.classList.remove('hidden')
		errorEl.innerText = error;
	}

	function displayMsg(message, type) {
		successEl.classList.remove('hidden');
		successEl.innerText = message;
	}

	function updateUserInfo() {
		s3.upload({
		  Bucket: CONFIG['bucket'],
	    Key: userKeyPrefix + 'user-info.json',
	    Body: JSON.stringify(user),
	  }, function(error, data) {
	    if (error) handleError(error);
	  });
	}

	function uploadFile(file) {
		showLoader();
		s3.upload({
		  Bucket: CONFIG['bucket'],
	    Key: userKeyPrefix + file.name,
	    Body: file,
	  }, function(error, data) {
	   	if (error) handleError(error);
	    else
	    	console.log('Successfully uploaded files.');
	    	displayMsg('Successfully uploaded files.', 'success') ;

	    hideLoader();
	  });

	}

	function updateFileListTemplate() {
		fileListEl.innerHTML = '';
		fileList.forEach(function(file) {
			var fileEl = document.createElement('li');
			fileEl.innerText = file.name;
			fileListEl.appendChild(fileEl);
		});
	}

	function setLoginTemplate() {
		mainEl.innerHTML = 'Please login to upload files. <br><br><a href="https://desert-gazelle.auth.us-east-1.amazoncognito.com/login?response_type=token&client_id=4sjvd0a57u5t7cljtmqvbeujm2&redirect_uri=https://127.0.0.1:8080/account.html" class="btn btn-outline primary-btn">Login</a>';
	}

	function init() {

		URLParams = getURLParams();
		auth = checkAuth();

		if (auth) {

			AWS.config.region = CONFIG['region'];

			serviceProvider = new AWS.CognitoIdentityServiceProvider({
				region: CONFIG['region'],
			});

			credentials = new AWS.CognitoIdentityCredentials({
		 		IdentityPoolId: CONFIG['identity_pool_id'],
		 		region: CONFIG['region']
			});
			AWS.config.credentials = credentials;

			serviceProvider.getUser({
				AccessToken: URLParams['access_token'],
			}, function(error, userData) {
				if (error) {
				  console.log(error, error.stack);
				  hideLoader();
				  setLoginTemplate();
				} else {
					user = userData;
					setTemplate();
					userLoggedIn(CONFIG['identity_pool_url'], URLParams['id_token'])

					AWS.config.credentials.get(function(error){
					    if (error) {
					      handleError(error);
					      hideLoader();
					    } else {
						    var id = AWS.config.credentials.identityId;
						    userKeyPrefix = 'users/' + id + '/';
						    s3 = new AWS.S3();
						    hideLoader();
						  }
					});
				}
			});
		} else {
			hideLoader();
			setLoginTemplate();
		}

 	}


 	fileInputEl.addEventListener('change', function(event) {
 		fileList = [];
 		for (var i = 0; i < fileInputEl.files.length; i++) {
 			fileList.push(fileInputEl.files[i]);
 		}
 		updateFileListTemplate();
 	});

 	fileHandlerEl.addEventListener('submit', function(event) {
 		event.preventDefault();
 		fileList.forEach(function(file) {
 			uploadFile(file);
 		});
 		fileList = [];
 		fileInputEl.value = '';
 		updateFileListTemplate();
 	});


 	init();

})();