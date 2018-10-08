import CacheableDataObject from '../CacheableDataObject';
import SmashFrame from "./SlippiFrame";

export default class SlippiStock extends CacheableDataObject{

    beforeConstruct(){
        this.startFrame = SmashFrame.createFromFameNumber(null);
        this.endFrame = SmashFrame.createFromFameNumber(null);
    }

    convertToLadderStock(){
        const data = {};
        data.stock_number = this.count;
        data.time_lost = this.endFrame.seconds();
        data.time_started = this.startFrame.seconds();
        data.damage_received = this.currentPercent;
        data.is_self_destruct = this.is_self_destruct;

        return data;
        /**
         * $data['stock_number'] = $this->stock_number;
         $data['time_lost'] = $this->time_lost;
         $data['time_started'] = $this->time_started;
         $data['damage_received'] = $this->damage_received;
         $data['actions'] = $this->time_started;
         */
    }
}
SlippiStock.prototype.dataLocationParsers= {
    startFrame(stock, data){
        stock.startFrame = SmashFrame.createFromFameNumber(data.startFrame);
    },
    endFrame(stock, data){
        stock.endFrame = SmashFrame.createFromFameNumber(data.endFrame);
    },
    count(stock, data){
        stock.count = Number.parseInt(data.count, 10);
    }
};