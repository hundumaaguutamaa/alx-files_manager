const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { MongoClient } = require('mongodb');
const DBClient = require('../utils/db');  // Adjust the path as necessary

chai.use(sinonChai);
const { expect } = chai;

describe('DBClient', function() {
    let dbClient;
    let mongoClientStub;
    let dbStub;

    beforeEach(function() {
        // Create a new instance of DBClient
        dbClient = new DBClient();

        // Create a sinon sandbox to isolate stubs and mocks
        const sandbox = sinon.createSandbox();

        // Stub the MongoClient methods
        mongoClientStub = {
            isConnected: sandbox.stub().returns(true),
            db: sandbox.stub().returns({
                collection: sandbox.stub().returns({
                    countDocuments: sandbox.stub().resolves(10)
                })
            })
        };
        
        // Replace MongoClient with the stub
        sandbox.stub(MongoClient, 'connect').resolves();
        sandbox.stub(MongoClient.prototype, 'db').callsFake(() => dbStub);
        dbStub = mongoClientStub;
        dbClient.client = mongoClientStub;
    });

    afterEach(function() {
        // Restore original methods
        sinon.restore();
    });

    describe('isAlive', function() {
        it('should return true if the MongoDB client is connected', function() {
            expect(dbClient.isAlive()).to.be.true;
            expect(mongoClientStub.isConnected).to.have.been.calledOnce;
        });
    });

    describe('nbUsers', function() {
        it('should return the count of users from the users collection', async function() {
            const count = await dbClient.nbUsers();
            expect(count).to.equal(10);
            expect(dbStub.collection).to.have.been.calledWith('users');
            expect(dbStub.collection().countDocuments).to.have.been.calledOnce;
        });

        it('should return 0 and log an error if an error occurs', async function() {
            dbStub.collection().countDocuments.rejects(new Error('DB error'));

            const count = await dbClient.nbUsers();
            expect(count).to.equal(0);
            expect(dbStub.collection().countDocuments).to.have.been.calledOnce;
        });
    });

    describe('nbFiles', function() {
        it('should return the count of files from the files collection', async function() {
            const count = await dbClient.nbFiles();
            expect(count).to.equal(10);
            expect(dbStub.collection).to.have.been.calledWith('files');
            expect(dbStub.collection().countDocuments).to.have.been.calledOnce;
        });

        it('should return 0 and log an error if an error occurs', async function() {
            dbStub.collection().countDocuments.rejects(new Error('DB error'));

            const count = await dbClient.nbFiles();
            expect(count).to.equal(0);
            expect(dbStub.collection().countDocuments).to.have.been.calledOnce;
        });
    });
});
