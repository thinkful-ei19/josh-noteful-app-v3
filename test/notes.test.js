'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const express = require('express');

const {TEST_MONGODB_URI } = require('../config');
console.log(TEST_MONGODB_URI);
const Note = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;

console.log(TEST_MONGODB_URI);

chai.use(chaiHttp);

describe('Notes API', function(){

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI);
  });
    
  beforeEach(function () {
    return Note.insertMany(seedNotes);
    //.then(() => Note.createIndexes());
  });
    
  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });
    
  after(function () {
    return mongoose.disconnect();
  });

  /*before(function () {
    return mongoose.connect(TEST_MONGODB_URI).then(()=>{console.log('connected to database');});
  });
    
  beforeEach(function () {
    return mongoose.connection.db.dropDatabase()
      .then(()=>{
        return Note.insertMany(seedNotes);
      })
      .then(() => Note.ensureIndexes())
      .then(()=>{console.log('seeded database');});
  });
    
  afterEach(function () {
    return mongoose.connection.db.dropDatabase().then(()=>{console.log('dropped database');});
  });
    
  after(function () {
    return mongoose.disconnect().then(()=>{console.log('disconnected from database');});
  });*/

  describe('GET /api/notes', function(){
    it('should return the correct number of notes', function(){
      //expect(true).to.be.true;
      const dbPromise = Note.find();
      const apiPromise = chai.request(app).get('/api/notes');

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return correct search results for a searchTerm query', function(){
      const term = 'gaga';
      const dbPromise = Note.find(
        { $text: { $search: term } },
        { score: { $meta: 'textScore' } })
        .sort({score: { $meta: 'textScore' } });
      const apiPromise = chai.request(app).get(`/api/notes?searchTerm=${term}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) =>{
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.be.a('object');
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });

    /*it('should return an empty array for an incorrect query', function () {
      const dbPromise = Note.find({ title: { $regex: /NotValid/i } });
      const apiPromise = chai.request(app).get('/api/notes?searchTerm=NotValid');
  
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });*/    
  });

  describe('GET /api/notes/:id', function(){
    it('should return note with correct id', function(){
      let data;
      return Note.findOne().select('id title content')
        .then(_data =>{
          data=_data;
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res)=> {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'created');

          expect(res.body.id).to.be.equal(data.id);
          expect(res.body.title).to.be.equal(data.title);
          expect(res.body.content).to.be.equal(data.content);
        });
    });

    it('should respond with a 404 for an invalid id', function(){
      return chai.request(app)
        .get('/api/notes/AAAAAAAAAAAAAAAAAAAAAAAA')
        .catch(err=> err.response)
        .catch(res=>{
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/notes', function(){
    const newItem = {
      'title': 'New title',
      'content': 'New content',
      'tags':[]
    };
    let body;
    return chai.request(app)
      .post('/api/notes')
      .send(newItem)
      .then(function(res){
        body = res.body;
        expect(res).to.have.status(201);
        expect(res).to.have.header('location');
        expect(res).to.be.json;

        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('id', 'title', 'content');
        return Note.findById(body.id);
      })
      .then(data=>{
        expect(body.title).to.equal(data.title);
        expect(body.content).to.be.equal(data.content);
      });
  });
});