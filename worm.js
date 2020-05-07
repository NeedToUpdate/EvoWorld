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
        this.hitbox = new Hitbox(x,y,UNIT,UNIT*2);
        this.hitbox.config.rotation = 'center';
        this.energy = 100;
        this.isTurning = false;
        this.isWalking = false;
        this.walkCooldown = 2;
        this.restNeeded = 2;
        this.turnTarget = 0;
        this.currentBehaviour = 'randomWalk';
        this.dead = false;
        this.bounds = {
            x1: 0,
            x2: width ||0 ,
            y1: 0,
            y2: height || 0,
        },
        this.appendages = [];
    }

    update(dt){
        if(this.dead) return;
        //behaviour
        this.doBehaviour();
        //turning
        if(this.isTurning) this.doTurn();
        //movement
        //walk cooldown
        if(this.isWalking){
            this.walkCooldown -= dt/1000;
            if(this.walkCooldown<= 0){
                this.isWalking = false;
            }
        }
        //dt scaling to make the numbers kinda work well
        dt = dt/(UNIT*3);
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

        //move hitbox
        this.hitbox.rotateTo(this.r);
        this.hitbox.moveTo(this.p.copy());

        //move appendages
        this.appendages.forEach(appendage=>{
            appendage.update(this.p,this.r)
        });



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
        if(this.isWalking) return;
        if(!strength) strength = 0;
        this.energy -= strength;
        let direction = Vector.fromAngle(this.r).mult(strength);
        this.a.add(direction);
        this.isWalking = true;
        this.walkCooldown = this.restNeeded;
    }
    doBehaviour(){
        // 'random walk'
        switch(this.currentBehaviour){
            case 'randomWalk':
                if(Math.random()>0.99) this.walk(1);
                if(Math.random()>0.95) this.turn(getRandom(-20,20));
                break;
            case 'rotate':
                this.turn(5);
                break;
            case 'moveForeward':
                this.walk(1);
                break;
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
    addAppendage(appendage, location){
        if(typeof appendage === 'string'){
            appendage = Appendage.create(appendage)
        }
        appendage.p = this.p;
        appendage.r = this.r;
        appendage.setLocation(location);
        this.appendages.push(appendage);
    }
    removeAppendage(name, location){
        if(this.appendages.length<1){
            console.log(`[worm] I don't have any appendages to remove`);
            return;
        }
        if(name === 'random'){
            let lost = this.appendages.splice(Math.random()*this.appendages.length|0,1);
            console.log(`[worm] My ${lost.name} was removed from my ${lost.location}`);
            return;
        }
        let appendage = this.appendages.filter(part=>{
           return part.name === name && part.location === location
        });
        if(appendage.length>0){
            this.appendages.splice(this.appendages.indexOf(appendage[0]),1);
            appendage[0].remove();
            console.log(`[worm] My ${appendage[0].name} was removed from my ${appendage[0].location}`);
        }else{
            console.log(`[worm] I dont have a(n) ${name} on my ${location}`);
        }
    }
}