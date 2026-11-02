package dz.poseco.terrain;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PoseCoPrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
