export default class HtmlClassList
{
    constructor(initialClassList){
        this.classes = new Map();
        this.finalValue = '';
        if(initialClassList)
        {
            initialClassList.split(' ').forEach((className)=>{
                this.addClass(className);
            })
        }
    }

    hasClass(entry){
        return this.classes.has(entry);
    }

    addClass(entry, value){
        this.classes.set(entry, value);
        if(value)
        {
            this.finalValue = value;
        }
        return this;
    }

    removeClass(entry){
        this.classes.delete(entry);
        return this;
    }

    toString(){
        return Array.from(this.classes.keys()).join(' ');
    }

    getFinalValue(){
        return this.finalValue;
    }

    keys(){
        return this.classes.keys();
    }

    [Symbol.iterator](){
        return this.classes.entries();
    }
}
HtmlClassList.prototype.push = HtmlClassList.prototype.addClass;
HtmlClassList.prototype.add = HtmlClassList.prototype.addClass;
HtmlClassList.prototype.set = HtmlClassList.prototype.addClass;
HtmlClassList.prototype.delete = HtmlClassList.prototype.removeClass;