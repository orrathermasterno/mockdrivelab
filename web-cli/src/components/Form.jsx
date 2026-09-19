export default function Form(props) {
  return (
    <form className="login-form" onSubmit={props.handleSubmit}>
      <div className="input-wrapper">

        <input
          onChange={props.handleEmailInput}
          value={props.email}
          type='text'
          placeholder='Email' />

        <input
          onChange={props.handlePasswordInput}
          value={props.password} 
          type='password'
          placeholder='Password' />
      </div>

      <button className="login-btn">
        {props.submitBtnText}
      </button>
    </form>
  )
}