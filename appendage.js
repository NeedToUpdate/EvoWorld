let offsets = {
    head: {p:new Vector(0,UNIT*2),r:180},
    butt: {p:new Vector(0,UNIT*2),r:0},
    right_side: {p:new Vector(UNIT*.5,UNIT*1.5), r: -90},
    left_side: {p:new Vector(UNIT*-.5,UNIT*1.5), r: 90},
    left_butt: {p:new Vector(UNIT*.5,UNIT*1.5), r: 90},
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
        this.dead = false;
        this.hasInput = false;
        this.hasOutput = false;
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
            case 'fat':
                return new Fat(0,0,0);
            default:
                console.log('no name chosen')
        }
    }
}

class Eye extends Appendage{
    constructor(x,y,r,location){
        super(x,y,r,location);
        this.name = 'eye';
        this.hitbox = new Hitbox(x+UNIT/2,y+UNIT*2,UNIT,UNIT*5);
        this.hasInput = true;
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
        if(this.hitbox.drawn) this.hitbox.draw();
    }
    remove(){
        this.hitbox.destroy();
    }
}

class Fat extends Appendage{
    constructor(x,y,r,location){
        super(x,y,r,location);
        this.name = 'fat';
        this.energy = 10;
        this.full = false;
        this.MAX_ENERGY = 100;
    }
    update(){
        if(this.energy === 0 ){
            this.dead = true;
        }
    }
    addEnergy(e){
        if(this.energy + e >= this.MAX_ENERGY){
            let temp = this.energy + e - this.MAX_ENERGY;
            this.energy = this.MAX_ENERGY;
            this.full = true;
            return temp;
        }
        this.energy += e;
        return 0;
    }
    getEnergy(amount){
        if(this.energy<=amount){
          let e = this.energy;
          this.energy = 0;
          this.dead = true;
          return e;
        }
        this.energy -= amount;
        if(this.energy<this.MAX_ENERGY) this.full = false;
        return amount;
    }
}