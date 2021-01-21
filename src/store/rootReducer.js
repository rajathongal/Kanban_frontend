import { combineReducers } from '@reduxjs/toolkit';
import { reducer as kanbanReducer } from 'src/slices/kanban';


const rootReducer = combineReducers({

  kanban: kanbanReducer,

});

export default rootReducer;
