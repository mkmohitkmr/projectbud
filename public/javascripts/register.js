function validate(){
    var fname = document.getElementById('fname').value.trim();
    var lname = document.getElementById('lname').value.trim();
    var username = document.getElementById('username').value.trim();
    var password1 = document.getElementById('password1').value.trim();
    var password2 = document.getElementById('password2').value.trim();
    
    error_message.style.padding = "10px";
    
    var text;

    if(fname.length === 0){
        text = "First Name should not be left blank!";
        error_message.innerHTML = text;
        return false;
    }

    if(lname.length === 0){
        text = "Last Name should not be left blank";
        error_message.innerHTML = text;
        return false;
    }

    if(username.length < 8){
        text = "Username should be at least 8 characters";
        error_message.innerHTML = text;
        return false;
      }

    if(password1.length < 8){
        text = "Password should be at least 8 characters";
        error_message.innerHTML = text;
        return false;
    }

    if(password2.length < 8){
        text = "Confirm Password should be at least 8 characters";
        error_message.innerHTML = text;
        return false;
    }

    if(password1 !== password2)
    {
        text = "Password and Confirm Password should match";
        error_message.innerHTML = text;
        return false;
    }

   
    
    return true;
  }