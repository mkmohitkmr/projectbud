// alert('Javascript added here!');

function validate(){
    var title = document.getElementById('title').value.trim();
    var abs = document.getElementById('abstract').value.trim();
    var keywords = document.getElementById('keywords').value.trim();
    var post_body = document.getElementById('post_body').value.trim();

    error_message.style.padding = "10px";
    
    var text;
    if(title.length < 30){
      text = "Title should be at least 30 characters";
      error_message.innerHTML = text;
      return false;
    }

    if(abs.length < 150){
      text = "Abstract should be at least 150 characters";
      error_message.innerHTML = text;
      return false;
    } else if(abs.length>300){
        text = "Abstract should be at most 300 characters";
        error_message.innerHTML = text;
        return false;
    }

    if(keywords.length===0){
      text = "Keywords should not be lft blank!";
      error_message.innerHTML = text;
      return false;
    }

    if(post_body.length < 200){
        text = "Description should be at least 200 characters";
        error_message.innerHTML = text;
        return false;
    }

    return true;
  }


console.log(addform);
