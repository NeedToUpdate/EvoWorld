class Hitbox {
    constructor(x, y, width, height, displayBounds) {
        this.x = x;
        this.y = y;
        this.x2 = x + width;
        this.y2 = y + height;
        this.h = height;
        this.w = width;
        this.a = new Vector(x, y);
        this.b = new Vector(x, this.y2);
        this.c = new Vector(this.x2, this.y2);
        this.d = new Vector(this.x2, y);
        this.angle = this.getAngle();
        this.config = {
            rotation: 'custom'
            //can be bottom, left, right, xy, center
        };
        this.points = [];
        if (displayBounds) {
            this.drawPoints();

        }
        this.drawn = false; //draw||false;
        if (this.drawn) {
            this.rect = document.createElement('div');
            document.body.appendChild(this.rect);
            Object.assign(this.rect.style, {
                height: height + 'px',
                width: width + 'px',
                top: y + 'px',
                left: x + 'px',
                position: 'absolute',
                border: 'solid black 1px',
                backgroundColor: 'none'
            })
        }
    }

    drawPoints() {
        this.drawn = true;
        this.points = [
            new Div(this.a.x, this.a.y, 'aqua'),
            new Div(this.b.x, this.b.y, 'blue'),
            new Div(this.c.x, this.c.y, 'cyan'),
            new Div(this.d.x, this.d.y, 'darkred'),];
        this.points[0].label = 'a';
        this.points[1].label = 'b';
        this.points[2].label = 'c';
        this.points[3].label = 'd';
    }

    hidePoints() {
        if (this.points.length) {
            this.points.forEach(point => {
                point.remove();
            });
            this.points = [];
        }
    }

    getAngle(rads) {
        return this.a.copy().sub(this.b).getAngle(rads)
    }

    modHeight(val) {
        this.h += val;
        this.c.y += val;
        this.b.y += val;
        this.draw();
    }

    modWidth(val) {
        this.w += val;
        this.c.x += val;
        this.d.x += val;
        this.draw();
    }

    contains(target) {
        if (target instanceof Hitbox) {
            return this.a.x < target.d.x && this.d.x > target.a.x && this.a.y < target.b.y && this.b.y > target.a.y;
        } else {
            let p = new Vector(target.x, target.y);
            let AB = this.b.copy().sub(this.a);
            let AP = p.copy().sub(this.a);
            let BC = this.c.copy().sub(this.b);
            let BP = p.copy().sub(this.b);
            let dotABAP = AB.dot(AP);
            let dotABAB = AB.dot(AB);
            let dotBCBP = BC.dot(BP);
            let dotBCBC = BC.dot(BC);
            return 0 <= dotABAP && dotABAP <= dotABAB && 0 <= dotBCBP && dotBCBP <= dotBCBC;
        }

    }

    rotateTo(r, rx, ry) {
        let nr = r - this.angle;
        return this.rotate(nr, rx, ry)

    }

    rotate(r, rx, ry) {
        let cx = 0;
        let cy = 0;
        //deal with rads
        this.angle += r;
        switch (this.config.rotation) {
            case 'center':
                cx = (this.x + this.x2) / 2;
                cy = (this.y + this.y2) / 2;
                break;
            case 'xy':
                cx = this.a.x;
                cy = this.a.y;
                break;
            case 'bottom':
                cx = (this.x + this.x2) / 2;
                cy = this.y2;
                break;
            case 'left':
                cx = this.x;
                cy = (this.y + this.y2) / 2;
                break;
            case  'right':
                cx = this.x2;
                cy = (this.y + this.y2) / 2;
                break;
            case 'top':
                cx = (this.x + this.x2) / 2;
                cy = this.y;
                break;
            case 'custom':
                cx = rx || this.x;
                cy = ry || this.y;
                break;
            default:
                break;
        }
        let p = {x: cx, y: cy};
        this.a.rotateAround(p, r);
        this.b.rotateAround(p, r);
        this.c.rotateAround(p, r);
        this.d.rotateAround(p, r);
        this.x = this.a.x;
        this.y = this.a.y;
        this.x2 = this.c.x;
        this.y2 = this.c.y;
        if (this.points) {
            this.draw()
        }
        return this
    }

    draw() {
        this.points.forEach(p => {
            let l = p.label;
            p.shape.style.top = this[l].y + 'px';
            p.shape.style.left = this[l].x + 'px';
        })

    }

    add(v) {
        this.a.add(v);
        this.b.add(v);
        this.c.add(v);
        this.d.add(v);
        this.x = this.a.x;
        this.y = this.a.y;
        this.x2 = this.c.x;
        this.y2 = this.c.y;
        return this
    }

    moveTo(p) {
        if (!(p instanceof Vector)) {
            console.error(this, '.moveTo() expects Vector');
            return;
        }
        if (!this.lastp) this.lastp = this.a.copy();
        let move = p.copy().sub(this.lastp);
        this.add(move);
        this.lastp = p.copy();
        if (this.points) {
            this.draw()
        }
        return this
    }

    destroy() {
        if (this.points) {
            this.points.forEach(point => {
                point.remove()
            })
        }
        if (this.drawn) {
            console.log('unhandled')
        }
    }

}