var diffmode=true;    // true for manual check, false for production
var debug=true;
var trimpage=true;


var jsonfn=process.argv[2]||"ketaka.json";  //default json filename
if (jsonfn.indexOf(".json")==-1)jsonfn+=".json";
var json=require("./"+jsonfn);

var source_xml_folder="before_xml/";
var merged_xml_folder="merged_xml/";

//////////////////////////////////////////////////////////////////////

var fs=require("fs");
var mkdirp=require("./mkdirp");
var path=require("path");
var lastfile="",pages={},currentfile="",currentpage="";
var unmerged=[],lasterror="",mergecount=0;

var errormerge=function(item){
	item.err=lasterror;
	lasterror="";
	if (debug) inserterror(item.offset,unmerged.length+1);
	unmerged.push(JSON.stringify(item));
}

var loadPage=function(filecontent) {
	var pages={},lastidx=0,lastid="_";
	filecontent.replace(/<pb id="(.+?)"\/>\n?/g,function(m,m1,idx){
		if (lastidx===0) {
			pages[lastid]=filecontent.substr(0,idx);
		}
		pages[lastid]=filecontent.substring(lastidx,idx);
		lastidx=idx+m.length;
		lastid=m1;
	});
	pages[lastid]=filecontent.substring(lastidx).trim();

	if (trimpage) for (var i in pages) pages[i]=pages[i].trim();

	return pages;
}
var fetchText=function(pagecontent,offset,len) {
	var realoff=getOffsetOmitTag(pagecontent,offset);
	if (typeof realoff !=="number" || realoff<0) return null;
	return pagecontent.substr(realoff,len);
}


var getOffsetOmitTag=function(pagecontent,offset){
	var intag=false;
	var remain=offset;
	for (var i=0;i<pagecontent.length;i++) {
		var c=pagecontent[i];
		if (c==='<') intag=true;
		if (remain==0) {
			if (intag) {
				lasterror="offset inside tag";
				return -i;
			} else {
				return i;
			}
		}
		if (!intag) remain--;
		if (c==='>') intag=false;
	}
	lasterror="invalid offset";
	return null;
}

var merge=function(item) {
	var page=pages[currentpage];
	var realoff=getOffsetOmitTag(page,item.offset);
	var newtext=diffmode?("["+item.from+"|"+item.to+"]"):item.to;
	pages[currentpage]=page.substr(0,realoff)+newtext+page.substr(realoff+item.from.length);
}
var inserterror=function(offset,err) {
	var page=pages[currentpage];
	var realoff=Math.abs(getOffsetOmitTag(page,offset));
	pages[currentpage]=page.substr(0,realoff)+"!"+err+page.substr(realoff);
}
var createnewfilecontent=function() {
	var s="";
	for (var i in pages) {
		if (i!=="_") s+='\n<pb id="'+i+'"/>\n';
		s+=pages[i];
	}
	return s;
}

var savemergefile=function() {
	if (!lastfile)return;
	var outfn=merged_xml_folder+lastfile;
	var dir=path.dirname(outfn);
	mkdirp.sync(dir);	//create folder if not exist
	fs.writeFileSync(outfn,createnewfilecontent(),"utf8");
}

var trymerge=function(item){	
	if (item.file!==lastfile) {
		savemergefile();
		currentfile=item.file;
		pages=loadPage(fs.readFileSync(source_xml_folder+item.file,"utf8"));
	}
	currentpage=item.page;
	var t=fetchText(pages[item.page],item.offset,item.from.length);

	if (!t) {
		if (!lasterror) lasterror="invalid offset";
		errormerge(item);
	} else if (t!==item.from) {
		if (!lasterror) lasterror="xml mismatch:"+t;
		errormerge(item);
	} else {
		if (t===item.to){
		 	lasterror="sametext";
			errormerge(item);
		} else {
			mergecount++;
			merge(item);
		}
	}
	lastfile=item.file;
}

json.map(trymerge);
savemergefile(); //last file content
var unmergefn=jsonfn.replace(".json","")+"_unmerged.json";
console.log("success merged",mergecount,"unmerged",unmerged.length,"check",unmergefn);
fs.writeFileSync(unmergefn,unmerged.join("\n"),"utf8")