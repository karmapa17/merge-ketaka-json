/* 
  usage
  convert ketaka json into a simpler format with old text to be replaced.
  markup offsets are sorted descendingly for easier merge.

  node gen lst_file kdbfn 
*/
var fs=require("fs");
var kde=require("ksana-database");
var lstfn="ketaka84.lst"||process.argv[2];
var kdb="jiangkangyur201504"||process.argv[3];


var db=null
  ,filenames=null //filenames in KDB
  ,totalmarkup=0
  ,filecontents="" //all text content in kdb
  ,json=[];       //output json

if (lstfn.indexOf(".lst")==-1) lstfn+=".lst";

var fetchText=function(f,seg,s,l){
	var str=filecontents[f][seg];
	return str.substr(s,l);
}

var filterApproved=function(ljfn,rows) {
	var fidx=filenames.indexOf(ljfn);
	var segnames=db.getFileSegNames(fidx);
	rows.forEach(function(row){
		var state=row.doc.payload.state;
		if (state!=="approve") return;
		var pageid=parseInt(row.doc.pageid);
		var oldtext=fetchText(fidx,pageid-1,row.doc.start,row.doc.len);

		json.push({f:fidx,p:pageid-1, //for sorting only
							file:ljfn,page: segnames[pageid-1], //human readible file name and pb id
							offset:row.doc.start, 
							from:oldtext, to:row.doc.payload.text //replace "from" with "to" at "offset"
							});
	});
}
var doconvert=function(file){
	var ljfn=file.substr(file.length-17,12).replace(/\\/,"/").replace("/","/lj").replace("-","_")+".xml";
	var rows=require("./"+file).rows;
	totalmarkup+=rows.length;
	filterApproved(ljfn,rows);
}

var sortByFilePageOffset=function(){
	json=json.sort(function(a,b){
		//assuming offset<65536, total page <4096
		//reverse order offset for easier merge
		return (a.f*4096*65536+a.p*65536+ (65536-a.offset)) -(b.f*4096*65536+b.p*65536+ (65536-b.offset));
	}).map(function(item){
		//remove f and p, not required after sort
		return {file:item.file,page:item.page,offset:item.offset,from:item.from,to:item.to};
	});
}

kde.open(kdb,function(err,_db){
	db=_db;
	db.get([["filecontents"],["filenames"]],{recursive:true},function(data){
		filecontents=data[0];
		filenames=data[1];
		var lst=fs.readFileSync(lstfn,"utf8").split(/\r?\n/).trim();
		lst.map(doconvert);
		sortByFilePageOffset();
		var outfn=lstfn.replace(".lst","")+".json";
		fs.writeFileSync(outfn,JSON.stringify(json,""," "),"utf8");
		console.log("json files in ",lstfn,"combined to",outfn);
		console.log("total markup",totalmarkup,",approved markup",json.length);
	})
})