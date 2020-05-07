class Worm{
    constructor(x,y){
        this.origin_x = x;
        this.origin_y = y;
        this.p = new Vector(x,y);
        this.r = 0;
        this.v = new Vector();
        this.old_v = new Vector();
        this.a = new Vector();
        this.brain = null;
        this.hitbox = new Hitbox(x,y,unit,unit*2);
        this.energy = 100;
        this.isTurning = false;
        this.turnTarget = 0;
        this.currentBehaviour = 'randomWalk';
        this.dead = false;
        this.bounds = {
            x1: 0,
            x2: width ||0 ,
            y1: 0,
            y2: height || 0,
        }
    }

    update(dt){
        if(this.dead) return;
        //behaviour
        this.doBehaviour();
        //turning
        if(this.isTurning) this.doTurn();
        //movement
        //dt scaling to make the numbers kinda work well
        dt = dt/(unit*3);
        this.a.add(this.a.copy().mult(-2*FRICTION_COEFF));
        this.v.add(this.a.copy().mult(dt));
        this.v.add(this.v.copy().mult(-1*FRICTION_COEFF));
        let real_v = this.v.copy().add(this.old_v).div(2);
        real_v.mult(dt).limit(SPEED_LIMIT);
        this.p.add(real_v);
        if(this.v.mag()<0.01) this.v.floor();
        if(this.a.mag()<0.01) this.a.floor();
        this.old_v = this.v.copy();
        this.handleOOB();
        //die if no energy
        if(this.energy<=0) this.die();
    }
    turn(deg){
        if(!this.isTurning){
            this.turnTarget = this.r + deg;
            this.isTurning = true;
        }
    }
    doTurn(){
        if(!this.isTurning) return;
        if(Math.abs(this.turnTarget - this.r) < 1){
            this.r = this.turnTarget;
            this.isTurning = false;
            return;
        }
        this.r = (this.r + this.turnTarget)/2;
    }
    walk(strength){
        if(!strength) strength = 0;
        this.energy -= strength;
        let direction = Vector.fromAngle(this.r).mult(strength);
        this.a.add(direction);
    }
    doBehaviour(){
        // 'random walk'
        switch(this.currentBehaviour){
            case 'randomWalk':
                if(Math.random()>0.99) this.walk(1);
                if(Math.random()>0.95) this.turn(getRandom(-20,20));
        }
    }
    die(){
        this.dead = true;
    }
    handleOOB(){
        if(this.p.x<this.bounds.x1) this.p.x = this.bounds.x1;
        if(this.p.x>this.bounds.x2) this.p.x = this.bounds.x2;
        if(this.p.y<this.bounds.y1) this.p.y = this.bounds.y1;
        if(this.p.y>this.bounds.y2) this.p.y = this.bounds.y2;
    }
}