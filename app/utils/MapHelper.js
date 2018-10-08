export default class MapHelper{

    static inPlaceSort(map, sort){
        const sorted = Array.from(map).sort(sort);
        map.clear();
        for(const [key, value] of sorted){
            map.set(key, value);
        }
        return map;
    }
}