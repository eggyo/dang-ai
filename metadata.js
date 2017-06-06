/*
metadata template
------------------
GET_QUIZ_BY_TAGS =
{
    "type": "GET_QUIZ_BY_TAGS",
    "query": <[tagArray]>
}
---------------

*/
module.exports = {
    metadataProcess: function(metadata) {
        var data = JSON.parse(metadata);
        var type = data.type;
        switch (type) {
            case "GET_QUIZ_BY_TAGS":
                var query = data.query;
                return {
                    "results": query
                };
                break;
            default:
                return;
        }

    }
};
