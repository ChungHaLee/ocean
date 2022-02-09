function titleAudio(){
    target = document.getElementById('thefile');
    target.addEventListener('change', function(){
        fileList = "";
        for(i = 0; i < target.files.length; i++){
            fileList += target.files[i].name;
        }
        realTitle = document.getElementById('title');
        realTitle.innerText = fileList;
    });
}

const button = document.getElementById('thefile');

button.addEventListener('click', titleAudio);