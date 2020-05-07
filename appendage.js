let offsets = {
    head: {p:new Vector(0,UNIT*-2),r:0},
    butt: {p:new Vector(0,UNIT*2),r:0},
    right_side: {p:new Vector(UNIT*-.5,UNIT*-1.5), r: 90},
    left_side: {p:new Vector(UNIT*.5,UNIT*-1.5), r: -90},
    left_butt: {p:new Vector(UNIT*-.5,UNIT*-1.5), r: -90},
    right_butt: {p:new Vector(UNIT*-.5,UNIT*1.5), r: -90},
};

class Appendage{
    constructor(x,y,r, location){
        this.name = 'appendage';
        this.p = new Vector(x,y);
        this.r = r;
        this.location = location || '';
        this.offset = new Vector(0,0);
        this.r_offset = 0;
        if(location){
            this.setLocation(location)
        }

    }
    use(){

    }
    update(vector){
        this.p = vector;
    }
    setLocation(location){
        this.location = location;
        let offset = offsets[location] || {p: new Vector(0,0), r:0};
        this.offset = offset.p.copy();
        this.r_offset = offset.r
    }
    remove(){
        console.log(`No remove function for this ${this.name}`)
    }
    static create(name){
        switch(name){
            case 'eye':
                return new Eye(0,0,0);
            default:
                console.log('no name chosen')
        }
    }
}

class Eye extends Appendage{
    constructor(x,y,r,location){
        super(x,y,r,location);
        this.name = 'eye';
        this.hitbox = new Hitbox(x+UNIT/2,y+UNIT*2,UNIT,UNIT*2,true);
    }
    use(arrayOfPoints){
        let found = [];
        arrayOfPoints.forEach(point=>{
            if(this.hitbox.contains(point)){
                found.push(new MemoryPiece(new Vector(point.x,point.y), point.name))
            }
        });
        return found;
    }
    update(vector,r){
        this.p = vector;
        this.r = r + this.r_offset;
        this.hitbox.moveTo(this.p.copy().add(this.offset));
        this.hitbox.rotateTo(this.r,this.p.x+UNIT/2,this.p.y+UNIT);
        //tODO remove later
        this.hitbox.draw();
    }
    remove(){
        this.hitbox.destroy();
    }
}