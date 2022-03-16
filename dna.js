class DNA {
  constructor(arrayOfValues) {
    //give an array that will encode how the dna needs to be decoded
    //[1,1,2,3,1] will give 1 byte, 1 byte, 2 bytes, 3 bytes, 1 byte when decoded
    this.structure = arrayOfValues;
    this.header = "";
    this.data = "";
    this.value_container = arrayOfValues ? this.createDNA() : "";
    this.parsedDataArray = [];
  }
  get value() {
    return this.value_container;
  }
  createDNA() {
    //handles the create logic
    this.header = this.createHeader();
    if (this.structure instanceof Array) {
      this.data = this.create(this.structure);
      return this.header + this.data;
    } else if (typeof this.structure === "number") {
      // return DNA.randomHex(this.structure);
      //   console.log("TODO");
    }
  }
  create(array) {
    //check for validity
    let ok = array.filter((x) => typeof x === "number").length === array.length;
    if (!ok) {
      //   console.error(`Array provided isn't valid. All values must be numbers`);
      return;
    }
    let DNAstring = "";
    array.forEach((value) => {
      DNAstring += DNA.randomHex(value);
    });
    return DNAstring;
  }
  static fromValues(values, structure) {
    structure = structure || values.map((x) => x.toString().length);
    let dna = new DNA();
    dna.structure = structure;
    dna.header = dna.createHeader(structure);
    dna.data = values.join("");
    dna.value_container = dna.header + dna.data;
    return dna;
  }
  createHeader(structure) {
    let header = "";
    function padZero(val) {
      let newval = val.toString();
      if (newval.length < 2) newval = "0" + newval;
      return newval;
    }
    function toHex(num) {
      return num.toString(16);
    }
    structure = structure || this.structure;
    if (structure instanceof Array) {
      let vals = this.structure;
      //first 2 bytes will be length
      let len = toHex(vals.length);
      if (len.length < 2) len = "0" + len;
      header += padZero(len);
      //next will be as following
      //store 4 bytes. first 2 bytes is the repetition, next 2 bytes is the value.
      //this actually creates a much bigger compression than the actual data,
      //so the next value will be a flag if the zero padding is needed

      //check the largest number in the array
      let flag = 0;
      if (vals.filter((x) => x > 15).length) {
        flag = 1;
      } else {
        //check to make sure no value repeats more than 15 times (or else the flag is needed)
        let tot = 0;
        let val = null;
        vals.forEach((x) => {
          if (x === val) {
            tot++;
            if (tot > 15) {
              flag = 1;
            }
          } else {
            val = x;
            tot++;
          }
        });
      }
      header += flag;
      let data = "";
      let valuepairs = [];
      let nextpair = { counter: 0, value: null };
      //start at 1 cause first value is already in the dataset
      for (let i = 0; i < vals.length; i++) {
        if (nextpair.value === vals[i]) {
          nextpair.counter++;
        } else {
          if (nextpair.value !== null) {
            let nextValue = "";
            if (flag) {
              nextValue += padZero(toHex(nextpair.counter)) + padZero(toHex(nextpair.value));
            } else {
              nextValue += toHex(nextpair.counter) + toHex(nextpair.value);
            }
            valuepairs.push(nextValue);
            nextpair = { counter: 0, value: null };
            nextpair.value = vals[i];
            nextpair.counter++;
          } else {
            nextpair.value = vals[i];
            nextpair.counter++;
          }
        }
      }
      //deal with last value;
      let nextValue = "";
      if (flag) {
        nextValue += padZero(toHex(nextpair.counter)) + padZero(toHex(nextpair.value));
      } else {
        nextValue += toHex(nextpair.counter) + toHex(nextpair.value);
      }
      valuepairs.push(nextValue);

      data += valuepairs.reduce((string, pair) => string + pair, "");
      //arrange it all into a string and return it;
      header += data;
      return header;
    }
  }
  parseHeader(header) {
    header = header || this.header;
    let len = parseInt(header.slice(0, 2), 16);
    let zeroPadFlag = parseInt(header.slice(2, 3));
    let skip = zeroPadFlag ? 4 : 2;
    //a bit fucky but its ok
    let [pointer, headerLength] = [0, 0];
    while (pointer < len) {
      //goes through each 2nd or 4th value (depending on the skip flag) and adds it to the total
      //if total reaches the length, then the counter (headerLength) is the number of key value pairs
      let val = header.slice(3 + headerLength * skip, 3 + headerLength * skip + skip / 2);
      pointer += parseInt(val, 16);
      headerLength++;
    }
    headerLength *= skip;
    //then we multiply the keyvalue pairs by the skip flag to know how many ints are in the data of the header

    let data = header.slice(3, 3 + headerLength);
    //parse the data like above
    let valuePairs = [];

    for (let i = 0; i < data.length / skip; i++) {
      valuePairs.push(header.slice(3 + i * skip, 3 + (i + 1) * skip));
    }
    let parsed_pairs = valuePairs.map((x) => {
      return { counter: parseInt(x.slice(0, skip / 2), 16), value: parseInt(x.slice(skip / 2, skip), 16) };
    });
    //sanity check
    if (len !== parsed_pairs.reduce((tot, a) => tot + a.counter, 0)) {
      //   console.error("something wrong with the header");
    }

    let finalArray = [];

    parsed_pairs.forEach((pair) => {
      for (let i = 0; i < pair.counter; i++) {
        finalArray.push(pair.value);
      }
    });
    return finalArray;
  }
  separateData(dataStringWithHeader) {
    //TODO fix this
    dataStringWithHeader = dataStringWithHeader || this.value_container;
    let len = parseInt(dataStringWithHeader.slice(0, 2), 16);
    let zeroPadFlag = parseInt(dataStringWithHeader.slice(2, 3));
    let skip = zeroPadFlag ? 4 : 2;

    let [pointer, headerLength] = [0, 0];
    while (pointer < len) {
      //goes through each 2nd or 4th value (depending on the skip flag) and adds it to the total
      //if total reaches the length, then the counter (headerLength) is the number of key value pairs
      pointer += parseInt(dataStringWithHeader.slice(3 + headerLength * skip, 3 + headerLength * skip + skip / 2));
      headerLength++;
    }
    headerLength *= skip;

    let header = dataStringWithHeader.slice(0, headerLength - 1);
    let data = dataStringWithHeader.slice(headerLength - 1);
    return { header: header, data: data };
  }
  get values() {
    if (this.parsedDataArray.length === 0) {
      let structure = this.structure;
      let pointer = 0;
      let dnaData = this.data;
      let dataArray = [];
      structure.forEach((val) => {
        dataArray.push(dnaData.slice(pointer, pointer + val));
        pointer += val;
      });
      this.parsedDataArray = dataArray;
      return Array.from(dataArray);
    } else {
      return Array.from(this.parsedDataArray);
    }
  }

  static randomHex(amount) {
    if (!amount) amount = 1;
    let str = "";
    for (let i = 0; i < amount; i++) {
      str += ((Math.random() * 16) | 0).toString(16);
    }
    return str;
  }
  get length() {
    return parseInt(this.header.slice(0, 2), 16);
  }
  static fromDNA(string) {
    let newDNA = new DNA();
    let headerData = newDNA.parseHeader(string);
    newDNA.value_container = string;
    newDNA.structure = headerData;
    newDNA.header = newDNA.createHeader(headerData);
    newDNA.data = string.slice(newDNA.header.length);
    return newDNA;
  }

  copy() {
    return DNA.fromDNA(this.value_container);
  }

  createMutation(chance) {
    let newVals = [];
    let values = this.values;
    values.forEach((value, i) => {
      let hex = parseInt(value, 16);
      if (Math.random() < chance) {
        let add = Math.random() <= 0.5;
        if (add) {
          if (i < 2 ** (this.structure[i] * 4) - 1) {
            newVals.push((hex + 1).toString(16));
          } else {
            newVals.push((hex - 1).toString(16));
          }
        } else {
          if (hex > 0) {
            newVals.push((hex - 1).toString(16));
          } else {
            newVals.push((hex + 1).toString(16));
          }
        }
      } else {
        newVals.push(hex.toString(16));
      }
    });
    return DNA.fromValues(newVals, this.structure);
  }
}
