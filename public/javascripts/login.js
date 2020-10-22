function validate(){
    var loginForm = document.querySelector('.loginForm form').value;
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    
    error_message.style.padding = "10px";
    
    var text;
    if(username.length < 8){
      text = "Username should be at least 8 characters";
      error_message.innerHTML = text;
      return false;
    }
    if(password.length < 6){
      text = "Password should be at least 6 characters";
      error_message.innerHTML = text;
      return false;
    }
    return true;
  }