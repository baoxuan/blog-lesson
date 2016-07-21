var crypto = require('crypto'),//用于生成散列值来加密密码
	User = require('../models/user.js');


module.exports =  function(app){

	app.get('/',function(req,res){
		res.render('index',{
			title:'主页',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash("error").toString()
		});
	});

	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'注册',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/reg',function(req,res){
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		// 检测用户两次输入的密码是否一致
		if(password_re != password){
			req.flash('error','两次输入的密码不一致!');
			return res.redirect('./reg');
		}
		//生成密码的md5值
		var md5 =  crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name:name,
			password:password,
			email:req.body.email
		});
		//检查用户名是否存在
		User.get(newUser.name,function(err,user){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			if(user){
				req.flash('error','用户已存在！');
				return res.redirect('/reg');//返回注册页
			}
			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/');
				}
				req.session.user = newUser;//用户信息存入session
				req.flash('success','注册成功！');
				res.redirect('/');//注册成功后返回主页
			})
		})
	});
	app.get('/login',function(req,res){
		res.render('login',{
			title:'登录',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		})
	});
	app.post('/login',function(req,res){
		var md5 = crypto.createHash('md5');
			password = md5.update(req.body.password).digest('hex');
		//检查用户是否存在
		User.get(req.body.name,function(err,user){
			if(!user){
				req.flash('error','用户不存在！');
				return res.redirect('/login');// 用户不存在跳转到登录页
			}
			if(user.password != password){
				req.flash('error','密码错误！');
				return res.redirect('/login');
			}
			req.session.user = user;
			req.flash('success','登录成功！');
			res.redirect('/');//登录成功后跳转到主页
		});
	});
	app.get('/post',function(req,res){
		res.render('index',{title:'发表'})
	});
	app.post('/post',function(req,res){
	});
	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','登出成功！');
		res.redirect('/');//登出成功跳转到主页

	});
};