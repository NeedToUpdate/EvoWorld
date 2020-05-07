class Food {

    constructor(amount, width, height) {
        this.canvasSize = {x:width|| 400, y:height|| 400}
        this.amount = amount || 20;
        this.pieces = [];
        this.eatenpieces = [];
        this.pieceDivs = [];
        this.drawing = false;

    }


    init(drawing) {
        this.drawing = drawing;
        for (let i = 0; i < this.amount; i++) {
            let piece = new Vector(Math.floor(Math.random() * this.canvasSize.x), Math.floor(Math.random() * this.canvasSize.y));
            let div = document.createElement('div');
            if (drawing) {
                Object.assign(div.style, Food.genStyle(piece.x, piece.y));
                document.body.appendChild(div);
            }
            this.pieces.push([piece, div]);

        }
    }

    reinit(drawing) {
        this.drawing = drawing;
        let temp = this.pieces.map(x => x);
        this.pieces.forEach(x => {
            document.body.removeChild(x[1])

        });
        temp = temp.concat(this.eatenpieces);
        this.pieces = [];
        this.eatenpieces = [];
        //console.log(temp)
        temp.forEach((p) => {
            let piece = p[0].copy();
            let div = document.createElement('div');
            if (this.drawing) {
                Object.assign(div.style, Food.genStyle(piece.x, piece.y));
                document.body.appendChild(div);
            }
            this.pieces.push([piece, div]);

        })
    }

    check2(vector, eat) { //using vectors

        for (let i = this.pieces.length - 1; i > 0; i--) {
            console.log(this.pieces[i][0].copy().sub(vector).mag());
            if (this.pieces[i][0].copy().sub(vector.copy().add(10)).mag() < 100) {
                if (eat) {
                    document.body.removeChild(this.pieces[i][1]);
                    this.pieces.splice(i, 1);
                }
                return true;
            }
        }
    }

    checkOne(p, box, eat) { //using my rect class
        let test;
        if (box instanceof Rect) {
            test = box.contains(p[0])
        } else {

            test = box.copy().sub(p[0]).mag() < 13
        }
        if (test) {
            //box.highlight()
            if (eat) {
                if (this.drawing && p[1].parentNode) p[1].parentNode.removeChild(p[1]);
                this.eatenpieces.push(this.pieces.splice(this.pieces.indexOf(p), 1)[0]);
            }
            return true;
        }

    }

    check(box, eat) {//using drawn divs
        for (let i = this.pieces.length - 1; i > 0; i--) {
            if (this.collide(this.pieces[i][1], box)) {
                if (eat) {
                    document.body.removeChild(this.pieces[i][1]);
                    this.eatenpieces.push(this.pieces.splice(i, 1)[0]);
                }
                return true;
            }
        }

    }

    collide(el1, el2) { //using drawin divs
        let rect1 = el1.getBoundingClientRect();
        let rect2 = el2.getBoundingClientRect();
        return !(
            rect1.top > rect2.bottom ||
            rect1.right < rect2.left ||
            rect1.bottom < rect2.top ||
            rect1.left > rect2.right
        );
    }

    static genStyle(x, y) {
        return {
            height: '3px',
            width: '3px',
            //border: 'green solid 1px',
            borderRadius: '50%',
            position: 'absolute',
            top: y + 'px',
            left: x + 'px',
            backgroundColor: 'pink'
        }
    }

}