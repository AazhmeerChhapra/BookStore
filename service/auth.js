const sessionIdToUserMap = new Map()
function setUser(id, name){
    sessionIdToUserMap.set(id, name);
}
function getUser(id){
    return sessionIdToUserMap.get(id);
}
module.exports = {setUser, getUser}