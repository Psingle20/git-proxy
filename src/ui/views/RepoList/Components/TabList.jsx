/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import React from 'react';
import GridItem from '../../../components/Grid/GridItem.jsx';
import GridContainer from '../../../components/Grid/GridContainer.jsx';
import CustomTabs from '../../../components/CustomTabs/CustomTabs';
import Repositories from './Repositories';

export default function Dashboard() {
  return (
    <div>
      <GridContainer>
        <GridItem xs={12} sm={12} md={12}>
          <CustomTabs
            title=""
            headerColor="primary"
            tabs={[
              {
                tabName: 'Repositories',
                tabContent: (<Repositories />),
              },
            ]
            } />
        </GridItem>
      </GridContainer>
    </div>
  );
}
