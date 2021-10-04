import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';
import axios from 'src/utils/axios';
import objFromArray from 'src/utils/objFromArray';
import gql from 'graphql-tag';
import client from '../utils/GQLClient';


const initialState = {
  isLoaded: false,
  lists: {
    byId: {},
    allIds: []
  },
  cards: {
    byId: {},
    allIds: []
  },
  members: {
    byId: {},
    allIds: []
  }
};

const slice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    getBoard(state, action) {
      const { board } = action.payload;
      
      state.lists.byId = objFromArray(board.lists);
      state.lists.allIds = Object.keys(state.lists.byId);

      state.cards.byId = objFromArray(board.cards);
      state.cards.allIds = Object.keys(state.cards.byId);

      state.members.byId = objFromArray(board.members);
      state.members.allIds = Object.keys(state.members.byId);

      state.isLoaded = true;
    },

    createList(state, action) {
      const { list } = action.payload;
      
      state.lists.byId[list._id] = list;
      state.lists.allIds.push(list._id);
    },
    updateList(state, action) {
      const { listUpdate } = action.payload;

      state.lists.byId[listUpdate._id] = listUpdate;
    },
    clearList(state, action) {
      const { listId } = action.payload;
      const { cardIds } = state.lists.byId[listId];

      state.lists.byId[listId].cardIds = [];
      state.cards.byId = _.omit(state.cards.byId, cardIds);
      _.pull(state.cards.allIds, ...cardIds);
    },
    deleteList(state, action) {
      const { listId } = action.payload;

      state.lists.byId = _.omit(state.lists.byId, listId);
      _.pull(state.lists.allIds, listId);
    },
    createCard(state, action) {
      const { createCard } = action.payload;

      state.cards.byId[createCard._id] = createCard;
      state.cards.allIds.push(createCard._id);
      state.lists.byId[createCard.listId].cardIds.push(createCard._id);
    },
    updateCard(state, action) {
      const { cardUpdate } = action.payload;

      _.merge(state.cards.byId[cardUpdate._id], cardUpdate);
    },
    updateDesCard(state, action) {
      const { cardDesUpdate } = action.payload;

      _.merge(state.cards.byId[cardDesUpdate._id], cardDesUpdate);
    },
    updateSubscriptionOfCard(state, action) {
      const {cardSubscription} = action.payload;

      _.merge(state.cards.byId[cardSubscription._id], cardSubscription);
    },
    moveCard(state, action) {
      const { cardId, position, listId } = action.payload;
      const { listId: sourceListId } = state.cards.byId[cardId];

      // Remove card from source list
      _.pull(state.lists.byId[sourceListId].cardIds, cardId);

      // If listId arg exists, it means that
      // we have to add the card to the new list
      if (listId) {
        state.cards.byId[cardId].listId = listId;
        state.lists.byId[listId].cardIds.splice(position, 0, cardId);
      } else {
        state.lists.byId[sourceListId].cardIds.splice(position, 0, cardId);
      }
    },
    deleteCard(state, action) {
      const { cardId } = action.payload;
      const { listId } = state.cards.byId[cardId];

      state.cards.byId = _.omit(state.cards.byId, cardId);
      _.pull(state.cards.allIds, cardId);
      _.pull(state.lists.byId[listId].cardIds, cardId);
    },
    addComment(state, action) {
      const { comment } = action.payload;
      const card = state.cards.byId[comment.cardId];
      
      card.comments.push(comment);
    },
    addChecklist(state, action) {
      
      const { cardId, data } = action.payload;
      const card = state.cards.byId[cardId];

      card.checklists.push(data.checklist);
    },
    updateChecklist(state, action) {
      const { cardId, checklist } = action.payload;
      console.log(action.payload)
      const card = state.cards.byId[cardId];

      card.checklists = _.map(card.checklists, (_checklist) => {
        if (_checklist._id === checklist._id) {
          return checklist;
        }

        return _checklist;
      });
    },
    deleteChecklist(state, action) {
      const { cardId, checklistId } = action.payload;
      const card = state.cards.byId[cardId];

      card.checklists = _.reject(card.checklists, { id: checklistId });
    },
    addCheckItem(state, action) {
      const { cardId, checklistId, checkItem } = action.payload;
      const card = state.cards.byId[cardId];

      _.assign(card, {
        checklists: _.map(card.checklists, (checklist) => {
          if (checklist.id === checklistId) {
            _.assign(checklist, {
              checkItems: [...checklist.checkItems, checkItem]
            });
          }

          return checklist;
        })
      });
    },
    updateCheckItem(state, action) {
      const {
        cardId,
        checklistId,
        checkItem
      } = action.payload;
      const card = state.cards.byId[cardId];

      card.checklists = _.map(card.checklists, (checklist) => {
        if (checklist.id === checklistId) {
          _.assign(checklist, {
            checkItems: _.map(checklist.checkItems, (_checkItem) => {
              if (_checkItem.id === checkItem.id) {
                return checkItem;
              }

              return _checkItem;
            })
          });
        }

        return checklist;
      });
    },
    deleteCheckItem(state, action) {
      const { cardId, checklistId, checkItemId } = action.payload;
      const card = state.cards.byId[cardId];

      card.checklists = _.map(card.checklists, (checklist) => {
        if (checklist.id === checklistId) {
          _.assign(checklist, {
            checkItems: _.reject(checklist.checkItems, { id: checkItemId })
          });
        }

        return checklist;
      });
    }
  }
});

export const reducer = slice.reducer;

export const getBoard = () => async (dispatch) => {
  /*const response = await axios.get('/api/kanban/board');

  dispatch(slice.actions.getBoard(response.data));*/
  const BOARD = gql`
  mutation{
    board{
      lists{
        _id
        cardIds
        name
      }
      cards {
        _id
        name
        attachments
        checklists{
          _id
          name
          checkItems{
            _id
            name
            state
          }
        }
        comments{
          _id
          cardId
          createdAt
          memberId
          message
        }
        due
        isSubscribed
        listId
        memberIds
        description
      }
      members{
        _id
        name
      }
    }
  }`;
  const {data} = await client.mutate({
    mutation: BOARD
  }).then(res => {return res})

  dispatch(slice.actions.getBoard(data));
};

export const createList = (name) => async (dispatch) => {
  const CREATE_LIST = gql`mutation ($name: String!){
    list(name: $name){
      _id
      name
      cardIds
    }
  }`;

  const {data} = await client.mutate({
    mutation: CREATE_LIST,
    variables: {name}
  }).then(res => {return res})
  /*const response = await axios.post('/api/kanban/lists/new', {
    name
  });

  dispatch(slice.actions.createList(response.data));*/
 
  dispatch(slice.actions.createList(data));
};

export const updateList = (listId, update) => async (dispatch) => {
  console.log(listId, update)
  const UPDATE_LIST = gql`mutation ($listId: String!, $name: String!){
    listUpdate(listId: $listId, name: $name){
      _id
      name
      cardIds
    }
  }
  `;
  const {data} = await client.mutate({
    mutation: UPDATE_LIST,
    variables: {listId: listId, name: update.name}
  }).then(res => {return res});
  
  dispatch(slice.actions.updateList(data));
  /*const response = await axios.post('/api/kanban/list/update', {
    listId,
    update
  });

  dispatch(slice.actions.updateList(response.data));*/
};

export const clearList = (listId) => async (dispatch) => {
  /*await axios.post('/api/kanban/lists/clear', {
    listId
  });

  dispatch(slice.actions.clearList({ listId }));*/

  const LIST_CLEAR = gql`mutation ($listId: String!){
    listClear(listId: $listId){
      _id
    }
  }`;
   await client.mutate({
    mutation: LIST_CLEAR,
    variables: {listId: listId}
  }).then(res => {return res});

  dispatch(slice.actions.clearList({ listId }));
};

export const deleteList = (listId) => async (dispatch) => {
  /*await axios.post('/api/kanban/lists/remove', {
    listId
  });

  dispatch(slice.actions.deleteList({ listId }));*/
  const DELETE_LIST = gql`mutation ($listId: String!){
    listDelete(listId: $listId){
      _id
    }
  }`;
  
  await client.mutate({
    mutation: DELETE_LIST,
    variables: {listId: listId}
  }).then(res => {return res});

  dispatch(slice.actions.deleteList({ listId }));
};

export const createCard = (listId, name) => async (dispatch) => {
  /*const response = await axios.post('/api/kanban/cards/new', {
    listId,
    name
  });

  dispatch(slice.actions.createCard(response.data));*/
  const CREATE_CARD = gql`mutation ($listId: String!, $name: String!){
    createCard(listId: $listId, name: $name){
      _id
      name
      attachments
      memberIds
      checklists{
        _id
        name
        checkItems{
          _id
          name
          state
        }
      }
      comments{
        _id
        cardId
        createdAt
        memberId
        message
      }
      due
      isSubscribed
      listId
      description
    }
  }`;

  const {data} = await client.mutate({
    mutation: CREATE_CARD,
    variables: {listId: listId, name: name}
  }).then(res => {return res});

  
  dispatch(slice.actions.createCard(data));
};

export const updateCard = (cardId, update) => async (dispatch) => {

  /*const response = await axios.post('/api/kanban/cards/update', {
    cardId,
    update
  });

  dispatch(slice.actions.updateCard(response.data));*/

  const UPDATE_CARD = gql`mutation ($cardId: String!, $name: String){
    cardUpdate(cardId: $cardId, name: $name){
      _id
      name
      due
      description
      listId
      comments{
        _id
        cardId
        createdAt
        memberId
        message
      }
      checklists{
        _id
        name
        checkItems{
          _id
          name
          state
        }
      }
      attachments
      isSubscribed
      memberIds
    }
  }
  
  `;
  

      const {data} = await client.mutate({
        mutation: UPDATE_CARD,
        variables: {cardId: cardId, name: update.name}
      }).then(res => {return res});
    
      dispatch(slice.actions.updateCard(data));

  
};

export const updateDesCard = (cardId, update) => async (dispatch) => {

  /*const response = await axios.post('/api/kanban/cards/update', {
    cardId,
    update
  });

  dispatch(slice.actions.updateCard(response.data));*/
 
  const UPDATE_DES_CARD = gql`mutation ($cardId: String!, $description: String){
    cardDesUpdate(cardId: $cardId, description: $description){
      _id
      name
      due
      description
      listId
      comments{
        _id
        cardId
        createdAt
        memberId
        message
      }
      checklists{
        _id
        name
        checkItems{
          _id
          name
          state
        }
      }
      attachments
      isSubscribed
      memberIds
    }
  }
  
  `;
      const {data} = await client.mutate({
        mutation: UPDATE_DES_CARD,
        variables: {cardId: cardId, description: update.description}
      }).then(res => {return res});
    
      dispatch(slice.actions.updateDesCard(data));
  
};

export const updateSubscriptionOfCard = (cardId, update) => async (dispatch) => {
  const UPDATE_SUB_CARD = gql`mutation ($cardId: String!, $isSubscribed: Boolean!){
    cardSubscription(cardId: $cardId, isSubscribed: $isSubscribed){
      _id
      name
      attachments
      checklists{
        name
        _id
        checkItems{
          _id
          name
          state
        }
      }
      comments{
        _id
        cardId
        createdAt
        message
        memberId
      }
      due
      isSubscribed
      listId
      memberIds
      description
    }
  }`;

  const {data} = await client.mutate({
    mutation: UPDATE_SUB_CARD,
    variables: {cardId: cardId, isSubscribed: update.isSubscribed}
  }).then(res => {return res});
  
  dispatch(slice.actions.updateSubscriptionOfCard(data));

};

export const moveCard = (cardId, position, listId) => async (dispatch) => {
  /*await axios.post('/api/kanban/cards/move', {
    cardId,
    position,
    listId
  });

  dispatch(slice.actions.moveCard({
    cardId,
    position,
    listId
  }));*/

  const MOVE_CARD = gql`mutation ($cardId: String!, $listId: String!, $position: Int){
    moveCard(cardId: $cardId, listId: $listId, position:  $position){
      listId
      cardId
      position
    }
  }`;

  dispatch(slice.actions.moveCard({
    cardId,
    position,
    listId
  }));

  await client.mutate({
    mutation: MOVE_CARD,
    variables: {cardId: cardId, listId: listId, position: position}
  }).then(res => {return res});



};

export const deleteCard = (cardId) => async (dispatch) => {
  /*await axios.post('/api/kanban/cards/remove', {
    cardId
  });

  dispatch(slice.actions.deleteCard({ cardId }));*/

  const DELETE_CARD = gql`mutation ($cardId: String!){
    deleteCard(cardId: $cardId){
      success
    }
  }`;

  await client.mutate({
    mutation: DELETE_CARD,
    variables: {cardId: cardId}
  }).then(res => {return res});

  dispatch(slice.actions.deleteCard({ cardId }));
};

export const addComment = (cardId, message) => async (dispatch) => {
  /*const response = await axios.post('/api/kanban/comments/new', {
    cardId,
    message
  });

  dispatch(slice.actions.addComment(response.data));*/

  const COMMENT = gql`mutation ($cardId: String!, $message: String!){
    comment(cardId: $cardId, message: $message){
      cardId
      createdAt
      memberId
      message
    }
  }`;

  const {data} = await client.mutate({
    mutation: COMMENT,
    variables: {cardId: cardId, message: message}
  }).then(res => {return res});

  
  dispatch(slice.actions.addComment(data));
};

export const addChecklist = (cardId, name) => async (dispatch) => {
  /*const response = await axios.post('/api/kanban/checklists/new', {
    cardId,
    name
  });
  const { checklist } = response.data;

  dispatch(slice.actions.addChecklist({
    cardId,
    checklist
  }));*/

  const ADD_CHECKLIST = gql`mutation ($cardId: String!, $name: String!){
    checklist(cardId: $cardId, name: $name){
      _id
      name
      checkItems{
        _id
        name
        state
      }
    }
  }`;

  const {data} = await client.mutate({
    mutation: ADD_CHECKLIST,
    variables: {cardId: cardId, name: name}
  }).then(res => {return res});


  dispatch(slice.actions.addChecklist({
    cardId,
    data
  }));

};

export const updateChecklist = (cardId, checklistId, update) => async (dispatch) => {
  /*const response = await axios.post('/api/kanban/checklists/update', {
    cardId,
    checklistId,
    update
  });
  const { checklist } = response.data;

  dispatch(slice.actions.updateChecklist({
    cardId,
    checklist
  }));*/

  const UPDATE_CHECKLIST = gql`mutation ($cardId: String!, $checklistId: String!, $name: String!){
    checkListUpdated(cardId: $cardId, checklistId: $checklistId, name: $name){
      _id
      name
      checkItems{
        _id
        name
        state
      }
    }
  }`;

  const {data} = await client.mutate({
    mutation: UPDATE_CHECKLIST,
    variables: {cardId: cardId, checklistId: checklistId, name: update.name}
  }).then(res => {return res});
console.log(data)
  dispatch(slice.actions.updateChecklist({
    cardId,
    checklist: data.checkListUpdated
  }));
};

export const deleteChecklist = (cardId, checklistId) => async (dispatch) => {
  await axios.post('/api/kanban/checklists/remove', {
    cardId,
    checklistId
  });

  dispatch(slice.actions.deleteChecklist({
    cardId,
    checklistId
  }));
};

export const addCheckItem = (cardId, checklistId, name) => async (dispatch) => {
  const response = await axios.post('/api/kanban/checkitems/new', {
    cardId,
    checklistId,
    name
  });
  const { checkItem } = response.data;

  dispatch(slice.actions.addCheckItem({
    cardId,
    checklistId,
    checkItem
  }));
};

export const updateCheckItem = (cardId, checklistId, checkItemId, update) => async (dispatch) => {
  const response = await axios.post('/api/kanban/checkitems/update', {
    cardId,
    checklistId,
    checkItemId,
    update
  });
  const { checkItem } = response.data;

  dispatch(slice.actions.updateCheckItem({
    cardId,
    checklistId,
    checkItem
  }));
};

export const deleteCheckItem = (cardId, checklistId, checkItemId) => async (dispatch) => {
  await axios.post('/api/kanban/checkitems/remove', {
    cardId,
    checklistId,
    checkItemId
  });

  dispatch(slice.actions.deleteCheckItem({
    cardId,
    checklistId,
    checkItemId
  }));
};

export default slice;
