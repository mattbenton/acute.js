acute.dom = (function () {

  function createCommentNode ( doc, text ) {
    return doc.createComment(text);
  }

  return {
    createCommentNode: createCommentNode
  };

}());
