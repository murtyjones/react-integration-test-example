import React from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import { Route, Link, MemoryRouter } from 'react-router-dom'

import { ACTIONS, LESSON_SLIDE_TYPES } from '../../../../src/constants'
import { reducersObjectNotYetCombined } from 'path/to/reducers'
import MyComponent from 'path/to/MyComponent'
import { setupIntegrationTest } from '../intSetup'

jest.mock('path/to/FetchWrapper')
import FetchWrapper from 'path/to/FetchWrapper'

describe('integration tests', () => {
  let chesterAdminIdToken = 'eyJ...'
    , chesterAdminUserId = '000000000000000000000000'
    , getLessonPayload = { body: 111 }
    , getManyLessonsPayload = [{ body: 222 }]
    , lessonId = 'fakeId'
    , lesson = {
    "_id" : lessonId,
    "isPublished" : true,
    "title" : "Print Statements!",
    "subtitle" : "How to show an output",
    "minutesToComplete" : 15,
    "slides" : [
      {
        "type" : LESSON_SLIDE_TYPES.FULL_PAGE_TEXT,
        "instructions" : "<p>slide1Instructions</p>",
        "editorInput" : "slide1EditorInput",
        "title" : "What is a Print Statement? ",
        "id" : "075866a6-7b18-4a6d-86c7-e4f5503e40af"
      },
      {
        "type" : LESSON_SLIDE_TYPES.FULL_PAGE_CODE_EDITOR,
        "prompt" : "slide2Prompt",
        "editorInput" : "slide2EditorInput",
        "id" : "6f1a9e61-6fcf-4fec-96ba-558912478786"
      },
      {
        "type": LESSON_SLIDE_TYPES.HALF_HALF,
        "instructions": "<p>slide3Instructions</p>",
        "editorInput": "slide3EditorInput",
        "id": "76915074-79eb-423c-b754-5151f099d947"
      }
    ],
    "updatedAt" : "2017-12-08T04:40:08Z"
  }
    , router = {}
    , props = {}
    , store
    , dispatchSpy
    , mounter
    , preMounter
    , component

  beforeEach(() => {
    preMounter = () => {
      FetchWrapper.mockImplementationOnce(() => Promise.resolve(getLessonPayload))
      FetchWrapper.mockImplementationOnce(() => Promise.resolve(getManyLessonsPayload))
      ;({ store, dispatchSpy } = setupIntegrationTest(reducersObjectNotYetCombined, router))
      store.dispatch({ payload: { idToken: chesterAdminIdToken }, type: ACTIONS.LOGIN_SUCCESS })
    }
    mounter = (Component, childProps, store) => {
      return mount(
        <MemoryRouter initialEntries={[ '/lessons/fakeId' ]}>
          <Provider store={ store }>
            <Route
              component={ matchProps => <Component { ...childProps } { ...matchProps } />}
              path="/lessons/:id" />

          </Provider>
        </MemoryRouter>
        , {
          context: {
            muiTheme: getMuiTheme()
            , match: { params: { id: lessonId } }
          },
          childContextTypes: {
            muiTheme: PropTypes.object.isRequired
            , match: PropTypes.object.isRequired
          }
        })
    }

  })

  afterEach(() => {
    FetchWrapper.mockClear()
  })

  describe('componentWillMount', () => {

    describe('when needsLesson', () => {
      beforeEach(() => {
        preMounter()
        component = mounter(MyComponent, props, store)
      })

      it('should dispatch the appropriate requests', () => {
        expect(dispatchSpy).toBeCalledWith({ type: ACTIONS.GET_LESSON_REQUEST })
        expect(dispatchSpy).toBeCalledWith({ type: ACTIONS.GET_MANY_USER_LESSONS_REQUEST })
      })

      it('should dispatch success methods with resolved payloads', () => {
        expect(dispatchSpy).toBeCalledWith({ type: ACTIONS.GET_LESSON_SUCCESS, payload: getLessonPayload })
        expect(dispatchSpy).toBeCalledWith({ type: ACTIONS.GET_MANY_USER_LESSONS_SUCCESS, payload: getManyLessonsPayload })
      })

      it('should pass the lessonId and userId when making requests', () => {
        expect(FetchWrapper.mock.calls[0][0]).toBe(`http://localhost:8080/api/lessons/${lessonId}`)
        expect(FetchWrapper.mock.calls[1][0]).toBe(`http://localhost:8080/api/userlessons?lessonId=${lessonId}&userId=${chesterAdminUserId}`)
      })
    })

    describe('when !needsLesson', () => {
      beforeEach(() => {
        preMounter()
        store.dispatch({ payload: lesson, type: ACTIONS.GET_LESSON_SUCCESS })
        component = mounter(MyComponent, props, store)
      })

      it('should dispatch the appropriate requests', () => {
        expect(dispatchSpy).not.toBeCalledWith({ type: ACTIONS.GET_LESSON_REQUEST })
        expect(dispatchSpy).not.toBeCalledWith({ type: ACTIONS.GET_MANY_USER_LESSONS_REQUEST })
      })

      it('should dispatch success methods with resolved payloads', () => {
        expect(dispatchSpy).not.toBeCalledWith({ type: ACTIONS.GET_LESSON_SUCCESS, payload: getLessonPayload })
        expect(dispatchSpy).not.toBeCalledWith({ type: ACTIONS.GET_MANY_USER_LESSONS_SUCCESS, payload: getManyLessonsPayload })
      })

      it('should pass the lessonId and userId when making requests', () => {
        expect(FetchWrapper.mock.calls.length).toBe(0)
      })

    })

    describe('initial render', () => { // enzyme can't handle arrays yet so testing will need to be done the buttons and such
      beforeEach(() => {
        preMounter()
        store.dispatch({ payload: lesson, type: ACTIONS.GET_LESSON_SUCCESS })
        component = mounter(MyComponent, props, store)
      })

      it('should render two svgs for forward and back buttons', () => {
        expect(component.find('svg').length).toBe(2)
      })

      it('should render the form', () => {
        expect(component.find('form[className="lessonWizardForm"]').length).toBe(1)
      })

      it('should render the form content div', () => {
        expect(component.find('div[className="lessonWizardFormContent"]').length).toBe(1)
      })

      it('should render slide title', () => {
        expect(component.find('div[id="title"]').length).toBe(1)
      })

      it('should render first slide instructions', () => {
        expect(component.find('div[id="instructions"]').length).toBe(1)
        expect(component.find('div[id="instructions"]').props()).toHaveProperty('dangerouslySetInnerHTML', { __html: lesson.slides[0].instructions })
      })


    })

  })





})