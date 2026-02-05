const { getDb } = require('./connectionFirebase');

const findUser = async (email, password) => {
    const db = await getDb();
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
        return null;
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // WARNING: In a real app, password should be hashed. 
    // This connects to the requirement of "finding user".
    // Assuming simple comparison for now as per "refactor... matching architecture" but logic is placeholder.
    if (user.password === password) {
        return { id: userDoc.id, ...user };
    }

    return null;
};

module.exports = {
    findUser
};
