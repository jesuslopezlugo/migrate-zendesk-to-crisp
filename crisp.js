require('dotenv').config();
const Crisp = require("crisp-api");
const CrispClient = new Crisp();
const identifier = process.env.CRISP_INDETIFIER
const key = process.env.CRISP_KEY
const websiteID = process.env.CRISP_WEBSITE_ID
CrispClient.authenticateTier("plugin", identifier, key);

const _getMessageAuthorNickName = (comment, ticket) => {
    if(comment.via.channel === "email"){
        return comment.via.source.from.name;
    }
    return comment.author_id === ticket.requester.id ? ticket.requester.name : ticket.assignee.name ||  ticket.assignee.email ||  "User Unknow"
}

const _getConversationState = (ticket) => {
    switch(ticket.status){
        case "pending":
            return "pending";
        case "open":
            return "unresolved";
        case "solved":
        case "closed":
            return "resolved";
        default:
            return "unresolved"
    }
}

const _getEmailFromTicket = (ticket) => {
    if(process.env.MODE === "test"){
        return ticket.requester.email ? ticket.requester.email.split("@")[0] + "@example.com" : "unknow@example.com";
    }
    return ticket.requester.email || "unknow@example.com";
};

exports.importZendeskTicket = async (ticket) => {
    return CrispClient.website.createNewConversation(websiteID).then(session_data => {
        const sessionID = session_data.session_id;
        console.log("Session ID: ", sessionID);
        return CrispClient.website.initiateConversationWithExistingSession(websiteID, sessionID).then( response =>{
            console.log("Session Initiated: ", response);
            const comments = ticket.comments || [];
            // console.log("Ticket: ", ticket);
            const metas = {
                "nickname": ticket.requester.name || "Unknow Nickname",
                "email": _getEmailFromTicket(ticket),
                "segments": ticket.tags || [],
                "subject": ticket.subject ? ticket.subject.replace("\n"," ").substring(0,2000) : "Unknow Subject",
                "phone": ticket.requester.phone || "",
                "locales": ticket.requester.locale ? [ticket.requester.locale] : []
            };
            // console.log("New Meta: ", metas, ticket.subject);
            return CrispClient.website.updateConversationMetas(websiteID, sessionID, metas).then(async (meta_response) => {
                // console.log("Meta Conversation updated", meta_response);
                try{
                    for(let comment of comments){
                        const message = {
                            "type": comment.public ? "text" : "note",
                            "from": comment.author_id === ticket.requester.id ? "user" : "operator",
                            "origin": comment.via.channel === "email" ? "email" : "chat",
                            "content": comment.plain_body || comment.html_body,
                            "timestamp": Date.parse(comment.created_at),
                            "stealth": comment.author_id !== ticket.requester.id && comment.public, // _from === "operator" && _type !== "note"
                            "user": {
                                "type":"website",
                                "nickname": _getMessageAuthorNickName(comment, ticket),
                            },
                            "original": {
                                "type":"text/html",
                                "content": comment.html_body
                            },
                            "fingerprint": comment.id
                        };
                        // console.log("New Message: ", message);
                        const message_response = await CrispClient.website.sendMessageInConversation(websiteID, sessionID, message) 
                        // console.log("New Message in Conversation: ", message_response);
                    }
                }catch(err){
                    console.error("Error sendMessageInConversation: ", err);
                    throw err;
                }
                return CrispClient.website.markMessagesReadInConversation(websiteID, sessionID,{
                    from : "user",
                    origin : "chat"
                }).then((status_response)=>{
                    // console.log("Messages Marked as Read: ", status_response);
                    const state = _getConversationState(ticket);
                    // console.log("Conversation State: ", ticket.status, state);
                    return CrispClient.website.changeConversationState(websiteID, sessionID, state).then(status_response=>{
                        console.log("Status Conversation updated ", status_response);
                    });
                })
               
            });
        });
    });
};