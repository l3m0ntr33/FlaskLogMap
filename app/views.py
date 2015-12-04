from flask import render_template, flash, redirect, jsonify
from app import app
from flask import request
import random
import string
import sqlite3
import sys, re
from os import listdir
from os.path import isfile, join

dbpath = "dbrep"

def linkConstruct(lnknb,lnksrc,lnkdst):
	lnk = {lnknb:{'factor':-0.3,'between':[lnksrc,lnkdst],'attrs':{'stroke' : 'red', 'stroke-width':2}}}
	return lnk

def plotConstruct(plotnb,plotlat,plotlong,plotdesc):
	plt = {plotnb : {'latitude' :plotlat, 'longitude' :plotlong, 'tooltip': {'content' : plotdesc}}}
	return plt

def legendConstruct(lgdfld1,lgdfld2,lgdfld3,lgdfld4):
	lgd = {'lgdfld1':lgdfld1,'lgdfld2':lgdfld2,'lgdfld3':lgdfld3,'lgdfld4':lgdfld4}
	return lgd

@app.route('/refresh', methods = ['POST'])
def refresh():
    #Input require : pdb, ptable, plat, plong, plgdfield1,plgdfield2,plgdfield3,plgdfield4, ptime, pgrpby,pgrpbyfld
    #Output : status, (error)

    #Control input data
    if (not 'pdb' in request.form) or (not 'ptable' in request.form) or (not 'plat' in request.form) or (not 'plong' in request.form) or (not 'plgdfield1' in request.form) or (not 'plgdfield2' in request.form) or (not 'plgdfield3' in request.form) or (not 'plgdfield4' in request.form) or (not 'ptime' in request.form) or (not 'pgrpby' in request.form) or (not 'pgrpbyfld' in request.form) :
	return jsonify({'status':'error','error':'Missing parameter'})


    #Control with regex all input data before construct SQL request
    #Bad characters forbidden : only digits, alphabetical, '-', '_' and '.'
    if re.search(r'^[\.\w-]+$',request.form['pdb']) is None:
	return jsonify({'status':'error','error':'DB file param format error'})
    if re.search(r'^[\.\w-]+$',request.form['ptable']) is None:
	return jsonify({'status':'error','error':'Table param format error'})
    if re.search(r'^[\.\w-]+$',request.form['plat']) is None:
	return jsonify({'status':'error','error':'Latitude param format error'})
    if re.search(r'^[\.\w-]+$',request.form['plong']) is None:
	return jsonify({'status':'error','error':'Longitude param format error'})
    if re.search(r'^[\.\w-]+$',request.form['plgdfield1']) is None:
	return jsonify({'status':'error','error':'Legend field 1 param format error'})
    if re.search(r'^[\.\w-]+$',request.form['plgdfield2']) is None:
	return jsonify({'status':'error','error':'Legend field 2 param format error'})
    if re.search(r'^[\.\w-]+$',request.form['plgdfield3']) is None:
	return jsonify({'status':'error','error':'Legend field 3 param format error'})
    if re.search(r'^[\.\w-]+$',request.form['plgdfield4']) is None:
	return jsonify({'status':'error','error':'Legend field 4 param format error'})
    if re.search(r'^\d+$',request.form['ptime']) is None:
	return jsonify({'status':'error','error':'Time refresh field param format error'})
    if re.search(r'^\w+$',request.form['pgrpby']) is None:
	return jsonify({'status':'error','error':'Group by param format error'})
    if re.search(r'^[\.\w-]+$',request.form['pgrpbyfld']) is None:
	return jsonify({'status':'error','error':'Group by field param format error'})

    try:
	    db = sqlite3.connect(dbpath + "/" + request.form['pdb'])

	    db_request = "select "+request.form['plat']+","+request.form['plong']+"," + request.form['plgdfield1'] + "," + request.form['plgdfield2'] + "," + request.form['plgdfield3'] +"," + request.form['plgdfield4'] +" from "+request.form['ptable']+" where insert_time > strftime('%Y-%m-%dT%H:%M:%S', 'now','localtime','-" + request.form['ptime'] +" seconds')"

	    if re.search(r'^yes$',request.form['pgrpby']) is not None :
	    	db_request = db_request + " group by " + request.form['pgrpbyfld']

	    cursor = db.execute(db_request)
    except sqlite3.Error, e:
    	return jsonify({'status':'error','error':'SQLite Error : ' + str(e)})

    myPlots = {}
    myLinks = {}
    myLegend = []
    for row in cursor:
	plotRef = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(6))
	linkRef = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(6))
	myPlots.update(plotConstruct(plotRef,row[0],row[1],str(row[2]+"<br>"+row[3]+"<br>"+row[4]+"<br>"+row[5]+"<br>")))
	myLinks.update(linkConstruct(linkRef,plotRef,'home'))
	myLegend.append(legendConstruct(row[2],row[3],row[4],row[5]))

    finalDic = {'newLinks':myLinks,'plots':myPlots,'myLegend':myLegend}
    finalDic.update({'status':'success'})
    db.close()
    return jsonify(finalDic)


@app.route('/dblist')
def dblist():
    dbfiles = [f for f in listdir(dbpath) if isfile(join(dbpath, f))]
    dbDic ={}
    for i in dbfiles:
	dbDic.update({i:i})
    return jsonify(dbDic)

@app.route('/tablelist', methods = ['POST'])
def tablelist():
    tableDic ={}
    db = sqlite3.connect(dbpath + "/" + request.form['data'])
    #db = sqlite3.connect("result_db")
    cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table'")
    for row in cursor:
	tableDic.update({row[0]:row[0]})
    db.close()
    return jsonify(tableDic)

@app.route('/collist', methods = ['POST'])
def collist():
    fieldDic ={}
    db = sqlite3.connect(dbpath + "/" + request.form['db'])
    req = "PRAGMA table_info(" + request.form['table'] + ")"
    cursor = db.execute(req)
    for row in cursor:
	fieldDic.update({row[1]:row[1]})
    db.close()
    return jsonify(fieldDic)

@app.route('/initHome')
def inithome():

    homepoint = {'home' : {'size':15, 'attrs':{'fill':"#FF6600"},'latitude' :48.86, 'longitude' :2.3444, 'tooltip': {'content' : 'Home sweet home'}}}

    return jsonify(homepoint)

@app.route('/')
@app.route('/map')
def map():
    return render_template("map.html")


