const puppeteer=require('puppeteer');
const fs=require('fs');
const downloader=require('image-downloader');

function GetLargestImageFromSrcSet(srcset){
    const linksWithSizeInfo =srcset.split(',');
    const result= linksWithSizeInfo[Object.keys(linksWithSizeInfo).length-1].split(' ')[0];
    return result;
}
function ExtractItems() {
    const imgs = Array.from(document.querySelectorAll('article img'));
    const srcSetAttribute = imgs.map(i => i.getAttribute('srcset'));
    return srcSetAttribute;
}
function Merge2Array(arr1,arr2){
    return mergedArray = arr1.concat(arr2.filter(function (item) {
        return arr1.indexOf(item) < 0;
    }));
}

async function GetAllImagesFromPage(pageURL,ExtractItems,itemTargetCount,scrollDelay=1000){
    console.log('this is get img func');
    //set up brower and page
    const brower=await puppeteer.launch();
    const page=await brower.newPage();
    console.log('start view set up');
    page.setViewport({ width: 1280, height: 926 });
    console.log('end view set up');
    await page.goto(pageURL);
    console.log('this is end set up');
    let imageSrcSets=[];
    let previousHeight;
    try {
        while (imageSrcSets.length<itemTargetCount) {
            console.log(imageSrcSets.length+ ' < '+ itemTargetCount);
            imageSrcSetsPerScroll=await page.evaluate(ExtractItems) ;
            imageSrcSets = Merge2Array(imageSrcSets,imageSrcSetsPerScroll) ;
            console.log('num');
            console.log(imageSrcSets.length);
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
            await page.waitFor(scrollDelay);
        }
    } catch (e) { }
    
    
    const allLinks=imageSrcSets.map(srcset=>GetLargestImageFromSrcSet(srcset));
    await brower.close();
    return allLinks;
}
async function main(){
    const resultFolder='./images';
    if(!fs.existsSync(resultFolder)){
        fs.mkdirSync(resultFolder);
    }

    const pageURL='https://www.instagram.com/onlyprfectgirls/?hl=en';
    const imgsURL=await GetAllImagesFromPage(pageURL,ExtractItems,50);
    
    //save images from given urls
    imgsURL.forEach(imgURL => {
        const options={
            url: imgURL,
            dest: resultFolder
        }
        downloader.image(options)
        .then(({filename,image})=>{
            console.log('filed saved to ',filename);
        })
        .catch((err)=>{
            console.log('an error has orrcured while trying to download images');
            console.log(err);
        })

        
        //console.log(filename);
    });
    
}
main();