var mongodb = require('./db'),
	markdown = require('markdown').markdown;


function Post(name, title, tags, post){
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.post =  post;
}
module.exports = Post;

Post.prototype.save = function(callback){
	var date = new Date();
	var time = {
		date:date,
		year:date.getFullYear(),
		month:date.getFullYear()+'-'+(date.getMonth()+1),
		day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
		minute:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+(date.getMinutes() <10 ? '0'+date.getMinutes():date.getMinutes())
	}

	var post = {
		name : this.name,
		time : time,
		title : this.title,
		tags: this.tags,
		post : this.post,
		comments:[]
	}
    //打开数据库
	mongodb.open(function (err,db){
		if(err){
			return callback(err);
		}
		//读取posts 集合
		db.collection('posts',function (err,collection){
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//将文档插入posts集合
			collection.insert(post,{
				safe:true
			},function(err){
				mongodb.close();
				if(err){
					return callback(err);//失败！返回err
				}
				callback(null);//返回err为null
			});
		});
	});
};

Post.getTen =  function(name, page, callback){
	//打开数据库
	mongodb.open(function (err,db){
		if(err){
			return callback(err);
		}
		//读取posts集合
		db.collection('posts',function (err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var query = {};
			if(name){
				query.name = name;
			}
			//使用count 返回特定查询的文档数 total
			collection.count(query,function (err, total) {
			//	根据query 对象查询,并跳过前(page-1)*10个结果,返回之后的10个结果
				collection.find(query,{
					skip:(page - 1)*10,
					limit:10
				}).sort({
					time:-1
				}).toArray(function (err, docs) {
					mongodb.close();
					if(err){
						return callback(err);
					}
					//解析markdown 为html
					docs.forEach(function (doc) {
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null,docs,total);
				})
			})
		});
	});
};
Post.getOne = function(name,day,title,callback){
	//打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts 集合
		db.collection("posts",function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名、发表日期及文章名进行查询
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				//解析markdown 为 html
				if(doc){
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function (comment){
						comment.content = markdown.toHTML(comment.content);
					});
				}
				callback(null,doc);
			});
		});
	});
};
//换回原始发表内容
Post.edit = function(name,day, title,callback){
	//打开数据
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts 集合
		db.collection('posts',function (err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,doc);//返回查询的一篇文章
			})
		})
	})
}
//更新一篇文章及相关信息
Post.update = function(name,day,title,post,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//读取posts 集合
		db.collection('posts',function (err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//更新文章内容
			collection.update({
				"name":name,
				"time.day":day,
				"title":title
			},{
				//$set 用来指定一个键的值,如果这个键不存在,则创建它,甚至可以修改数据类型.也可以用$unset 将键删除
				$set:{post:post}
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
// 删除文章
Post.remove = function(name,day,title,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		};
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			//根据用户名、日期和标题查找并删除一篇文章
			collection.remove({
				"name":name,
				"time.day":day,
				"title":title
			},{
				w:1
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
// 返回所有文字存档信息
Post.getArchive = function (callback) {
	//打开数据库
	mongodb.open(function (err,db) {
		if(err){
			return callback(err);
		}
	//	读取posts 集合
		db.collection("posts",function (err,collection) {
			if(err){
				mongodb.close();
				return callback(err);
			}
			// 返回只包含name,time,title属性的文档组成的存档数组
			collection.find({},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};
Post.getTags = function (callback) {
	mongodb.open(function (err,db) {
		if(err){
			return callback(err);
		}
		db.collection('posts',function (err,collection) {
			if(err){
				mongodb.close();
				return callback(err);
			}
			// distinct 用来找出给定键的所有不同值
			collection.distinct('tags',function (err,docs) {
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
};

