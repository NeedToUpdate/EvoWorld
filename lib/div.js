class DomObject{
    constructor(x,y){
        this.p = new Vector(x,y)
        this.shape = {};
        this.isRect = false;
        this.isLine = false;
        this.removed = false;
        this.r = 1;
    }
    get vector(){
        return new Vector(this.x,this.y);
    }
    get(attr){
        return this.shape.style[attr];
    }
    getVal(attr){
        return parseInt(this.shape.style[attr]);
    }
    get x(){
        return parseInt(this.shape.style.left) || this.p.x;
    }
    get y(){
        return parseInt(this.shape.style.top) || this.p.y;
    }
    set x(val){
        this.p.x = val;
        this.set('left', val  - (this.isRect ? 0: this.r+1) + 'px')
    }
    set y(val){
        this.p.y = val;
        this.set('top',val - (this.isRect ? 0 : this.r+1) + 'px')
    }
    set(attr, val) {
        if(this.removed) return;
        this.shape.style[attr] = val;
    }
    mod(attr, val){

        if(this.removed) return;
        let attribute = this.shape.style[attr];
        let value = parseInt(attribute);
        if(isNaN(value)) {
            let e = new ErrorHandler('attr is not a value');
            return;
        }
        //probably is a beter way for this
        let suffix = attribute.split(value)[1];
        value+= val;
        this.shape.style[attr] = value + suffix;
    }
    moveTo(p){
        this.set('top',p.y-(this.isRect?0:this.r+1) + 'px');
        this.set('left',p.x-(this.isRect?0:this.r+1) + 'px');
    }
    rotateTo(num){
        this.set('transform','rotate('+num+'deg)')
    }
    add(div){
        if(div instanceof DomObject){
            this.shape.appendChild(div.shape)
        }else{
            this.shape.appendChild(div)
        }
    }
    remove() {
        if(this.removed) return;
        this.removed = true;
        this.shape.parentNode.removeChild(this.shape)
    }
}


class LoadingBar extends DomObject{
    constructor(x,y,w,h,start,stop,val){
        super(x,y);
        this.w = w || 100;
        this.h = h || 10;
        this.startVal = start || 0;
        this.stopVal = stop || 100;
        this.currVal = val || 100;
        this.type = 'health';
        this.shapeOutline = document.createElement('div');
        this.shape = document.createElement('div');
        this.init();
    }
    init(){
        Object.assign(this.shapeOutline.style,{
            position: 'absolute',
            height: this.h + 'px',
            width: this.w + 'px',
            border: 'solid black 2px',
            top: this.y -1 + 'px',
            left: this.x -1 + 'px',
        });
        Object.assign(this.shape.style, {
            position: 'absolute',
            height: this.h + 'px',
            width: '0px',
            backgroundColor: 'green',
        });
        this.value = this.currVal;
        document.body.appendChild(this.shapeOutline)
        this.shapeOutline.appendChild(this.shape)
    }
    set(attr, val) {
        if(this.removed) return;
        this.shapeOutline.style[attr] = val;
    }
    setBar(attr, val){
            if(this.removed) return;
            this.shape.style[attr] = val;
    }
    set value(val){
        this.currVal = val;
        let percent = (this.currVal-this.startVal)/(this.stopVal===0?1:this.stopVal);
        this.setBar('width', this.w*percent + 'px');

        if(this.type === 'health') {
            if (percent > .5) {
                this.setBar('backgroundColor', 'green');
            } else if (percent > .1) {
                this.setBar('backgroundColor', 'yellow');
            } else if (percent >= 0) {
                this.setBar('backgroundColor', 'red');
            }
        }
    }
    get value(){
        return this.currVal;
    }

    remove(){
        this.shapeOutline.parentNode.removeChild(this.shapeOutline);
        this.removed = true;
    }

}

class Line{
    constructor(x1,y1,x2,y2,color){
        this.a = new Vector(x1,y1)
        this.b = new Vector(x2,y2)
        this.length = Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2))
        this.angle = this.b.copy().sub(this.a).perp().getAngle()

        this.line = new Div(x1,y1,('none'),this.length,1,true,this.angle,true)
        this.line.shape.style.backgroundColor = color || 'rgba(255,255,255,255)'
        //this.line.shape.style.borderRadius = '6%'
    }

    draw(){


    }
    destroy(){
        if(this.line){
            this.line.remove()
            this.line = null;
        }
    }


}

class DivLine extends DomObject{
    constructor(x,y,r,rot,color,thickness){
        super();
        this.p = new Vector(x,y)
        this.color = color || "white";
        this.r = r || 1; //if isRect then this is w
        this.w = r;
        this.rot = rot || 0;
        this.shape = document.createElement('div');
        this.h = thickness || 1;
        this.init();
    }
    init(){

        Object.assign(this.shape.style, {
            height: this.h + 'px',
            width: this.r + 'px',
            top: this.p.y  + 'px',
            left: this.p.x + 'px',
            transformOrigin: '0% 50%',
            backgroundColor: this.color,
            position: 'absolute',
            transform: this.rot ? 'rotate(' + this.rot + 'deg)' : ''
        });
        document.body.appendChild(this.shape);
    }
}

class Div extends DomObject{
    constructor(x, y, color, r, h, isRect, rot, isLine) {
        super();
        this.p = new Vector(x,y)
        this.color = color;
        this.r = r || 1; //if isRect then this is w
        this.w = isRect ? r : 0;
        this.h = h || 0;
        this.rot = rot || 0;
        this.shape = document.createElement('div');
        this.isRect = isRect;
        this.isLine = isLine;
        this.init();

    }
    init(){

        Object.assign(this.shape.style, {
            height: (this.isRect ? this.h : this.r * 2) + 'px',
            width: (this.isRect ? this.w : this.r * 2) + 'px',
            top: this.p.y - (this.isRect ? 0 : this.r+1) + 'px',
            left: this.p.x  - (this.isRect ? 0: this.r+1) + 'px',
            border: (this.color ? this.color : 'white') + ' solid 1px',
            transformOrigin: (this.isLine? '0% 50%':'center center'),
            //backgroundColor: 'white',
            borderRadius: this.isRect ? '' : '50%',
            position: 'absolute',
            transform: this.rot ? 'rotate(' + this.rot + 'deg)' : ''
        });
        document.body.appendChild(this.shape);
    }

}
class P extends DomObject{
    constructor(string,x,y){
        super(x,y);
        this.stringVal = string;
        this.shape = document.createElement('p');
        this.text = {}
        this.removed = false;
        this.init()

    }
    init(){
        Object.assign(this.shape.style,{
            position:'absolute',
            top: this.p.y + 'px',
            left: this.p.x + 'px',
            color: 'white',
        })
       this.text = document.createTextNode(this.stringVal)
       this.shape.appendChild(this.text)
       document.body.appendChild(this.shape)
    }
    get string(){
        return this.text.data;
    }
    set string(val){
        this.text.data = val;
    }
}
class ImageLoader{
    constructor(path, array_of_names){
        this.imagepaths = array_of_names.map(x=>{
            return {name: x, path:path+x+'.png'};
        });
        this.load();
        this.array_of_names = array_of_names;
        this.path = path;
    }
    load(){
        this.imagepaths.forEach(obj=>{
            this[obj.name] = ImageLoader.createImg(obj.path);
        })
    }
    static createImg(path){
        let img = new Image();
        img.src = path;
        Object.assign(img.style,new StyleMaker('small').genStyle() );
        document.body.appendChild(img);
        return img
    }
    get names(){
        return this.array_of_names;
    }
    add(nameorarray){
        if(nameorarray instanceof Array){
            nameorarray.forEach(name=>{
                this[name] = ImageLoader.createImg(this.path + '/' + name + '.png');
            })
        }else if(typeof nameorarray === 'string'){
            this[nameorarray] = ImageLoader.createImg(this.path + '/' + nameorarray + '.png');
        }
        else{
            console.error('unexpected format to add to ImageLoader')
        }
    }
}
class StyleMaker{
    constructor(type){
        this.type = type;
        this.default = {
            position: 'absolute',
            top: '0px',
            left: '0px',
        };
        this.genStyle();
    }
    genStyle(){
        if (!this.type) return this.default;
        if(this.type === 'small') {
            this.default.width = '50px';
            return this.default;
        }
    }
}
class Img {
    constructor(src, x, y, w, loadcenter, rot, h) {
        this.x = x;
        this.y = y;
        this.w = w || -1;
        this.h = h || -1;
        this.rot = rot || 0;
        this.shape = {};
        this.shape.src = '';
        this.permaload = false;
        this.loadcenter = loadcenter;
        if(typeof src === "string"){
            this.shape = document.createElement("img");
            this.shape.src = src;
        }else{
            this.shape = src;
        }
        this.removed = false;
        if(this.y === 'bottom' && typeof src === 'string'){
            this.shape.onload = ()=>{
                this.draw();
                this.y = height - this.shape.height;
                this.set('top', this.y + 'px');
                this.onload();
            }
        }else{
            this.shape.onload = ()=>{
                this.onload();
            }
            this.draw();
        }

    }
    onload(){}
    get(attr){
        return this.shape.style[attr];
    }
    getVal(attr){
        return parseInt(this.shape.style[attr], 10);
    }
    add(div, remove){
        if(div instanceof DomObject){
            if(remove){
                div.shape.parentNode.removeChild(div.shape)
            }
            this.shape.appendChild(div.shape)
        }else{
            this.shape.appendChild(div)
        }
    }
    draw() {

        if(this.removed) return;
        document.body.appendChild(this.shape);

        let style = {
            position: "absolute",

            transform: this.rot? "rotate(" + this.rot +"deg)" : "",
        };
        if (this.w > -1) {
            style.width = this.w + 'px';
        }
        if (this.h > -1) {
            style.height = this.h + 'px';
        }
        style.top = this.y -(this.loadcenter?this.shape.style.height : 0) + "px";
        style.left =  this.x -(this.loadcenter?this.shape.style.width : 0)  + "px";
        Object.assign(this.shape.style, style);
    }

    set(attr, val) {
        if(this.removed) return;
        if(attr === 'top' && this.loadcenter){
            val = parseInt(val,10);
            val-= this.shape.height/2;
            val += 'px'
        }
        if(attr === 'left' && this.loadcenter){
            val = parseInt(val,10);
            val-= this.shape.width/2;
            val += 'px'
        }

        this.shape.style[attr] = val ;
    }
    get vector(){
        return new Vector(parseInt(this.shape.style.left,10), parseInt(this.shape.style.top,10))
    }
    get angle(){
        //very specific, only used when rotation is already set
        let rotation = this.shape.style.transform
        let angle = 0;
        if(rotation.match('rotate')){
            angle = parseInt(this.shape.style.transform.replace(/[rotate(|)]/gi, ""));
            if(!isNaN(angle)){
                return angle;
            }else{
                return 0
            }
        }else {
            return 0;
        }
    }
    set angle(val){

        this.shape.style.transform = "rotate("+ val + 'deg)';
        this.rot = val;
    }
    mod(attr, val){

        if(this.removed) return;

        if(attr === "rotate"){
            let angle = parseInt(this.shape.style.transform.replace(/[rotate(|)]/gi, ""));
            if(!isNaN(angle)){
                angle += val;
            }else{
                angle = val;
            }
            this.shape.style.transform = "rotate("+ angle + 'deg)'
            return;

        }
        let attribute = this.shape.style[attr];
        let value = parseInt(attribute);
        if(isNaN(value)) {
            let e = new ErrorHandler('attr is not a value', this);
            return;
        }
        //probably is a beter way for this
        let suffix = attribute.split(value)[1];
        value+= val;
        this.shape.style[attr] = value + suffix;
    }
    destroy() {
        if(this.removed) return;
        if (this.shape) {
            if(!this.permaload){
                try{
                    document.body.removeChild(this.shape);
                }catch (e) {
                    console.log(e)
                }

                this.shape = undefined;
                this.removed = true;
            }else{
                this.set('width', '50');
                this.set('top', '0');
                this.set('left', '0');
                this.shape = undefined;
                this.removed = true;
            }

        }
    }
}