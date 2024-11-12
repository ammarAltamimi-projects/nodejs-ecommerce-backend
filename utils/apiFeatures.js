// This class provides methods to handle various MongoDB query operations 
class ApiFeature {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
    }

     //we have 3 type in filter : 
     //1 for direct key {key:value} or array of item {key:[value1,value2,value4,..]} we will search direct find({key:value}) or  find({key:value1})
     //2 for obj or array of obj will search by dot like find({key.keyOfObj:value}) 
     //3 for $ such gte|gt|lte|lt|in first will add $ then will put the value 

     // for example for ?subcategoryType= phone&variant[sku]=abcdefg&sold[gt]=6&category[in]=id1,id2
 
     filter() {
      //.1 clear then i will get the output such as 
           // {
      //   subcategoryType: ' phone',
      //   variant: { sku: 'abcdefg' },
      //   sold: { gt: '6' },
      //   category: { in: 'id1,id2' }
      // }
      const queryStringObj = { ...this.queryString };
      const excludesFields = ["limit", "page", "sort", "keyword", "fields"];
      excludesFields.forEach((field) => delete queryStringObj[field]);
      
     //2.now gte|gt|lte|lt|in they have $ before them then you should add that so output will be 
    //  {
    //    subcategoryType: ' phone',
      //   'variant': { sku: 'abcdefg' },
    //    sold: { '$gt': '6' },
    //    category: { '$in': 'id1,id2' }
    //  }
    //note we use  JSON.stringify to convert to string to use replace and after that we return it to its main value by JSON.parse
      const interim = JSON.parse(
        JSON.stringify(queryStringObj).replace(
          /\b(gte|gt|lte|lt|in)\b/g,
          (match) => `$${match}`
        )
      );
      

      //3 now we have two filter type 
      // one the value of filter is obj 
      //one the value of filter is single value 
      //so will do following steps :
      //A : convert obj into array to make loop for it so when we convert obj to array will be like 
      // [
      //   [ 'subcategoryType', ' phone' ],
      //   [  'variant': { sku: 'abcdefg' } ],
      //   [ 'sold', { '$gt': '6' } ],
      //   ['category',{ '$in': 'id1,id2' } ]
      // ]      
      // B: now will define obj filterCriteria to be filter in find + will do loop for array so in each nested array like i  [ 'subcategoryType', ' phone' ] mean  [key, val]   we have two option 
      // first option : value is not obj so its single value so will add  its as key and value so so will be filterCriteria[key]=val such as  [ 'subcategoryType', ' phone' ] 
      // second option : value is obj and not array because typeOf obj it may array or obj so we said is not array so for example 
      // [key, val] = [ 'sold', { '$gt': '6' } ] so val = { '$gt': '6' }
      //[key, val] =  [ 'variant': { sku: 'abcdefg' } ] so val =  { sku: 'abcdefg' } 
      //now will do will get key of val so Object.keys(val)[0] mean Object.keys({ '$gt': '6' }) will give [$gt] then[0] will give $gt and will be same for  { sku: 'abcdefg' } 
      //now will do will get value of val so Object.values(val)[0] mean Object.values({ '$gt': '6' }) will give [6t] then[0] will give 6 and will be same for   { sku: 'abcdefg' } 
      // now we have two option here 
      // if  key of val is in ["$gt", "$gte", "$lt", "$lte",'$in'] then now we have  filter  in form {'sold', { '$gt': '6' }} or {'category',{ '$in': 'id1,id2' } so if its $in then we should convert string id1,id2 to array [id1,id2] because $in needed array other wise will be same like 6(offer will be num so convert to num)
      //   if key of val is not in  ["$gt", "$gte", "$lt", "$lte",'$in'] then now we have  filter  in form  {'variant': { sku: 'abcdefg' }} and will convert to  {'variant.sku', 'abcdefg' }
    
      const filterCriteria = {};
      Object.entries(interim).forEach(([key, val]) => {
        if (typeof val === "object" && !Array.isArray(val)) {
          //get the key and its value
          const keyOfObj = Object.keys(val)[0]
          const valueOfKey = Object.values(val)[0]
          const op =  ["$gt", "$gte", "$lt", "$lte",'$in'].includes(keyOfObj)          
          if (op) {
            const value = keyOfObj === "$in" ? valueOfKey.split(",") :Number(valueOfKey);
            filterCriteria[key] = { [keyOfObj]: value};
          } else {
            Object.entries(val).forEach(([subKey, subVal]) => {
              filterCriteria[`${key}.${subKey}`] = subVal;
            });
          }
        } else {
          filterCriteria[key] = val;
        }
      });
    
      // 4. apply final filter which in form of 
      // {
      //   subcategoryType: ' phone',
      //   'variant.sku': 'abcdefg',
      //   sold: { '$gt': 6 },
      //   category: { '$in': [ 'id1,', 'id2' ] }
      // }
      console.log(filterCriteria);
      this.mongooseQuery = this.mongooseQuery.find(filterCriteria);
    
      return this;
    }
     


    // Sorts the query results based on the `sort` query parameter, or defaults to sorting by creation date in descending order.
  sort(){
    if(this.queryString.sort){
      // for example ?sort=-sold
      // for example ?sort=-variant.price

        const sortBy = this.queryString.sort.split(",").join(" ");

        this.mongooseQuery = this.mongooseQuery.sort(sortBy);

    } else{
        this.mongooseQuery = this.mongooseQuery.sort("-createAt");
    
    }

    return this;
  }


    // Limits the fields returned by the query based on the `fields` query parameter.
  limitFields(){

    if(this.queryString.fields){
       // for example ?fields=sold
      // for example ?fields=variant
        const fieldsBy = this.queryString.fields.split(",").join(" ");
        this.mongooseQuery = this.mongooseQuery.select(fieldsBy);
    }else{
        this.mongooseQuery = this.mongooseQuery.select("-__v");
    
    }    

    return this;
  }
  
  
    // Adds a search functionality using the `keyword` query parameter.
  search(modelName){
    let query = {}
    if(this.queryString.keyword && this.queryString.subcategoryType){

        if(modelName === "Product"){
             query = {$or:[{"variant.keywords":this.queryString.keyword},{title:{$regex:this.queryString.keyword,$options:"i"}},{description:{$regex:this.queryString.keyword,$options:"i"}},{subcategoryType: this.queryString.subcategoryType,"variant.variantTitle":{$regex:this.queryString.keyword,$options:"i"}},{subcategoryType: this.queryString.subcategoryType,"variant.variantDescription":{$regex:this.queryString.keyword,$options:"i"}}]}

        }else{
             query = {$or:[{name:{$regex:this.queryString.keyword,$options:"i"}}]}

        }
    
        this.mongooseQuery = this.mongooseQuery.find(query);
    }
    
    return this;
  }
  
  
      //  Handles pagination by calculating the number of items per page (`limit`) and the page number (`page`).
  paginate(countDocuments){

    const page = this.queryString.page * 1   || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    // Pagination result
    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPage = Math.ceil(countDocuments / limit);
    if(page < pagination.numberOfPage ){
        pagination.nextPage = page + 1;

    }
    if(page > 1){
        pagination.prevPage = page - 1;
    }

    this.pagination = pagination


    return this;
  }


}


module.exports = ApiFeature;
