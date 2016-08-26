var mongodb = require('./db'),
	markdown = require('markdown').markdown,
	async =  require('async');


function Post(name, head, title, tags, post){
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
	this.post = post;
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
		head : this.head,
		time : time,
		title : this.title,
		tags: this.tags,
		post : this.post,
		comments:[],
		reprint_info:{},
		pv:0
	}

	async.waterfall([
		//打开数据库
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			});
		},
		function (db, cb) {
			//读取posts 集合
			db.collection('posts', function (err, collection) {
				cb(err, collection);
			});
		},
		function (collection, cb) {
			//将文档插入posts集合
			collection.insert(post,{
				safe:true
			},function (err) {
				cb(err)
			});
		}],function (err) {
			mongodb.close();
			callback(err);
	});
};

Post.getTen =  function(name, page, callback){
	//打开数据库
	async.waterfall([
		function (cb) {
			mongodb.open(function (err,db) {
				cb(err, db);
			})
		},
		function (db, cb) {
			db.collection('posts', function (err, collection) {
				cb(err, collection);
			})
		},
		function (collection, cb) {
			var query = {};
			if (name) {
				query.name = name;
			}
			//	根据query 对象查询,并跳过前(page-1)*10个结果,返回之后的10个结果
			collection.count(query, function (err, total) {
				collection.find(query, {
					skip: (page - 1) * 10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function (err, docs) {
					docs.forEach(function (doc) {
						doc.post = markdown.toHTML(doc.post);
					})
					cb(err, docs, total);
				});
			})
		}
	],function (err, docs, total) {
		mongodb.close();
		callback(err, docs, total);
	})
};
Post.getOne = function(name, day, title, callback){
	//打开数据库
	async.waterfall([
		function (cb) {
			mongodb.open(function (err,db) {
				cb(err,db);
			})
		},
		function (db,cb) {
			db.collection('posts',function (err,collection) {
				cb(err, collection);
			})
		},
		function (collection, cb) {
			//根据用户名、发表日期及文章名进行查询
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function (err, doc) {
				if(doc){
					//每访问1次,pv值增加1
					collection.update({
						"name":name,
						"time.day":day,
						"title":title
					},{
						$inc:{"pv":1}
					});
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function (comment) {
						comment.content = markdown.toHTML(comment.content);
					});
				}
				cb(err,doc);
			})
		}
	],function (err, doc) {
		mongodb.close();
		callback(err, doc);
	})
};
//换回原始发表内容
Post.edit = function(name,day, title,callback){
	//打开数据
	async.waterfall([
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			});
		},
		function (db, cb) {
			db.collection('posts',function (err, collection) {
				cb(err,collection);
			});
		},
		function (collection, cb) {
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function (err, doc) {
				cb(err,doc);
			})
		}
	],function (err,doc) {
		mongodb.close();
		callback(err,doc);
	});
}
//更新一篇文章及相关信息
Post.update = function(name,day,title,post,callback){
	async.waterfall([
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			});
		},
		function (db, cb) {
			db.collection('posts',function (err,collection) {
				cb(err, collection);
				});
		},
		function (collection, cb) {
			collection.update({
				"name":name,
				"time.day":day,
				"title":title
			},{//$set 用来指定一个键的值,如果这个键不存在,则创建它,甚至可以修改数据类型.也可以用$unset 将键删除
				$set:{post:post}
			},function (err) {
				cb(err);
			})
		}
	],function (err) {
		mongodb.close();
		callback(err);
	})
};
//删除一篇文章
Post.remove = function(name, day, title, callback) {
    //打开数据库
	async.waterfall([
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			})
		},
		function (db, cb) {
			db.collection('posts',function (err, collection) {
				cb(err, collection)
			})
		},
		function (collection, cb) {
			collection.findOne({
				"name":name,
				"time.day":day,
				"title":title
			},function (err, doc) {
				//如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
				var reprint_from = "";
				if (doc.reprint_info.reprint_from) {
					reprint_from = doc.reprint_info.reprint_from;
				}
				if(reprint_from != ""){
					//更新原文章所在文档的 reprint_to
					collection.update({
						"name":reprint_from.name,
						"time.day":reprint_from.day,
						"title":reprint_from.title
					},{
						$pull:{
							"reprint_info.reprint_to":{
								"name":name,
								"time.day":day,
								"title":title
							}}
					})
				};
				//删除转载来的文章所在的文档
				collection.remove({
					"name":name,
					"time.day":day,
					"title":title
				},{
					w:1
				});
				cb(err);
			})
		}
	],function (err) {
		mongodb.close();
		callback(err);
	})
};
// 返回所有文字存档信息
Post.getArchive = function (callback) {
	//打开数据库
	async.waterfall([
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			})
		},
		function (db, cb) {
			db.collection("posts",function (err, collection) {
				cb(err, collection);
			})
		},
		function (collection, cb) {
			collection.find({},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function (err, docs) {
				cb(err, docs);
			})
		}
	],function (err, docs) {
		mongodb.close();
		callback(err, docs);
	})
};
Post.getTags = function (callback) {
	async.waterfall([
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			})
		},
		function (db, cb) {
			db.collection('posts',function (err, collection) {
				cb(err, collection);
			})
		},
		function (collection, cb) {
			collection.distinct('tags',function (err,docs) {
				cb(err, docs);
			})
		}
	],function (err, docs) {
		mongodb.close();
		callback(err, docs);
	})
};
Post.getTag = function(tag, callback) {
	async.waterfall([
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			});
		},
		function (db, cb) {
			db.collection("posts",function (err, collection) {
				cb(err, collection);
			})
		},
		function (collection, cb) {
			//查询所有 tags 数组内包含 tag 的文档
			//并返回只含有 name、time、title 组成的数组
			collection.find({
				"tags":tag
			},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function (err, docs) {
				cb(err, docs);
			})
		}
	],function (err, docs) {
		mongodb.close();
		callback(err, docs);
	})
};
Post.search = function (keyword, callback) {
	async.waterfall([
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			})
		},
		function (db, cb) {
			db.collection('posts',function (err, collection) {
				cb(err, collection);
			})
		},
		function (collection, cb) {
			var pattern = new RegExp(keyword,'i');
			collection.find({
				"title":pattern
			},{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function (err, docs) {
				cb(err, docs);
			})
		}
	],function (err,docs) {
		mongodb.close();
		callback(err,docs);
	})
};
//转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback) {
	async.waterfall([
		function (cb) {
			mongodb.open(function (err, db) {
				cb(err, db);
			})
		},
		function (db, cb) {
			db.collection('posts',function (err,collection) {
				cb(err, collection);
			})
		},
		function (collection, cb) {
			collection.findOne({
				"name":reprint_from.name,
				"time.day":reprint_from.day,
				"title":reprint_from.title
			},function (err, doc) {
				var date =  new Date();
				var time = {
					date:date,
					year:date.getFullYear(),
					month:date.getFullYear() + "-" + (date.getMonth()+1),
					day:date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(),
					minute:date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate()+ "-" +
						date.getHours() + ":" +(date.getMinutes() < 10 ? '0'+ date.getMinutes() : date.getMinutes() )
				};
				delete  doc._id;//删除原来的_id

				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title:"[转载]"+doc.title;
				doc.comments = [];
				doc.reprint_info = {"reprint_from":reprint_from};
				doc.pv = 0;

				collection.update({
					"name":reprint_from.name,
					"time.day":reprint_from.day,
					"title":reprint_from.title,
				},{
					$push:{
						"reprint_info.reprint_to":{
							"name":doc.name,
							"day":time.day,
							"title":doc.title
						}
					}
				});
				collection.insert(doc,{
					safe:true
				},function (err,post) {
					cb(err,post);
				});
			})
		}
	],function (err,post) {
		mongodb.close();
		callback(err,post.ops[0]);
	})     
};

