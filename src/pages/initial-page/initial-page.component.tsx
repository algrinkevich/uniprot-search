import { useNavigate } from "react-router-dom";

import Button, { ButtonType } from "../../components/button/button.component";
import StartPageBackground from "../../components/start-page-background/start-page-background.component";

import "./initial-page.styles.scss";

const InitialPage = () => {
  const navigate = useNavigate();

  const goToLoginHandler = () => {
    navigate("/auth");
  };

  return (
    <StartPageBackground>
      <div className="initial-page-container">
        <h1 className="title">{"Uniprot Search"}</h1>
        <p className="description">
          {
            "Find your protein in UniProt Knowledgebase with lighweighted search"
          }
        </p>
        <Button
          buttonType={ButtonType.INITIAL_WHITE}
          onClick={goToLoginHandler}
        >
          {"Login"}
        </Button>
      </div>
    </StartPageBackground>
  );
};

export default InitialPage;
