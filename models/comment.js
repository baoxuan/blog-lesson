var mongodb = require('./db');
function Comment(name,day,title,comment){
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function(callback){
	var name = this.name,
		day = this.day,
		title = this.title,
		comment = this.comment;
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts 集合
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//通过用户名、时间、及标题查找文档，并把一条留言对象添加到该文档的comments数组里
			collection.update({
				"name":name,
				"time.day":day,
				"title":title
			},{
				// $push 会向已有的数组末尾加入一个元素,要是没有就会创建一个数组
				$push:{"comments":comment}
			},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
};