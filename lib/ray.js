class Ray{
    constructor(x,y,angle){
    this.p = new Vector(x,y);
    this.dir = Vector.fromAngle(angle);
    //this.point = new Div(x,y,'yellow',4)
    this.ray = new Line(x,y,this.dir.x+x,this.dir.y+y,'yellow');
    this.closest= Infinity;
    this.beam;
    }
    move(v){
     this.p.add(v);
     this.closest = Infinity
    }
    cast(line,wantdist){
        let count = 1;
        let points = [];
        if(line instanceof Array){
            count = line.length
        }else{
            line = [line]
        }
        for(let i = 0; i<count;i++){
        let x1 = line[i].a.x;
        let x2 = line[i].b.x;
        let y1 = line[i].a.y;
        let y2 = line[i].b.y;
        
        let x3 = this.p.x;
        let y3 = this.p.y;
        let x4 = this.dir.x + this.p.x;
        let y4 = this.dir.y + this.p.y;
        let p = null;
        let d = Infinity;
        let den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
        if(den !== 0){
            let num = (x1-x3)*(y3-y4) - (y1-y3)*(x3-x4);
            if((den>0&&num>=0&&den>=num)||(den<0&&num<=0&&den<=num)){
                let u_num = -((x1-x2)*(y1-y3)-(y1-y2)*(x1-x3));
                if((u_num>=0&&den>0&&den<=u_num)||(u_num<=0&&den<0&&den>=u_num)){
                let t = num/den;
                let newx = x1+ t*(x2-x1);
                let newy = y1+ t*(y2-y1);
                p = {x:newx,y:newy}
                }
            }
        }
        if(p) d = this.p.dist(p);
        if(d<this.closest){
            this.closest = d;
            points.push({point:p,dist:d})   
        }    
        }
        if(points.length){
        //console.log(points)
            let p =points.reduce((a,b)=>{
                if(a.dist<=b.dist){
                    return a
                }else{
                    return b
                }
            }).point;
            
            this. beam = new Line(this.p.x,this.p.y,p.x,p.y);
            this.closest = Infinity;
            if(wantdist){
                return this.p.dist(p)
            }else{
            return p
            }
        }else{
            this.closest = Infinity;
            return null
        }
    }
    destroy(){
        //this.point.remove()
        this.ray.destroy();
        if(this.beam){
            this.beam.destroy()
        }
    }
}