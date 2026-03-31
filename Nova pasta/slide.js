let count = 1;
document.getElementById('radio1').checked=true;
setInterval(function(){
    nextImage();

},3000)

function nextImage(){
    count++;
    if(count>4){  //Enqunto count não for maior que quatro o loop não encerra, retorna pra primeira imagem
        count = 1;
    }
    document.getElementById('radio'+count).checked = true
}